from transliterate import translit
import re
from fastapi import APIRouter, HTTPException, Depends, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.db.models.user import User
from app.db.models.invitation import Invitation, InvitationStatus
from app.db.session import get_write_session, get_read_session
from app.services.stats import increment_daily_user_stat
from app.services.auth import create_session, hash_password, delete_session
import httpx
from app.core.settings import settings
from pydantic import BaseModel
import secrets

router = APIRouter()


class GoogleLoginPayload(BaseModel):
    id_token: str


class FacebookLoginPayload(BaseModel):
    user: dict


def process_name(name: str) -> str:
    if re.fullmatch(r"[A-Za-z\s\-']+", name):
        return translit(name, 'bg')
    return name

# ------------------------------
# Google login
# ------------------------------
@router.post("/google-login")
async def google_login(
    payload: GoogleLoginPayload,
    request: Request,  # <-- add this
    db_read: AsyncSession = Depends(get_read_session),
    db_write: AsyncSession = Depends(get_write_session),
):
    # manually extract the anonymous_session_id from cookies
    anon_session_id = None
    cookie_header = request.headers.get("cookie")
    if cookie_header:
        from http.cookies import SimpleCookie

        cookies = SimpleCookie(cookie_header)
        if "anonymous_session_id" in cookies:
            anon_session_id = cookies["anonymous_session_id"].value

    id_token = payload.id_token
    verify_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
    async with httpx.AsyncClient() as client:
        resp = await client.get(verify_url)
        if resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid Google ID token",
            )
        data = resp.json()

    if data.get("aud") != settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid audience in token"
        )

    email = data.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email not available"
        )

    first_name = process_name(data.get("given_name", ""))
    last_name = process_name(data.get("family_name", ""))
    profile_picture = data.get("picture")

    result = await db_read.execute(select(User).filter_by(email=email))
    user = result.scalars().first()

    if not user:
        hashed_password = hash_password(secrets.token_urlsafe(16))
        user = User(
            email=email,
            hashed_password=hashed_password,
            role="customer",
            first_name=first_name,
            last_name=last_name,
            profile_picture=profile_picture,
        )
        db_write.add(user)
        await db_write.commit()
        await db_write.refresh(user)

    # -------------------- Claim drafts before deleting anon session --------------------
    if anon_session_id:
        result_user_invites = await db_read.execute(
            select(func.count(Invitation.id)).where(
                Invitation.owner_id == user.id,
                Invitation.status == InvitationStatus.DRAFT
            )
        )
        user_invite_count = result_user_invites.scalar() or 0


        result_drafts = await db_read.execute(
            select(Invitation).where(Invitation.anon_session_id == anon_session_id)
        )

        drafts = result_drafts.scalars().all()
        max_allowed = 3 - user_invite_count
        drafts_to_transfer = drafts[:max_allowed] if max_allowed > 0 else []

        for draft in drafts_to_transfer:
            draft = await db_write.merge(draft)
            draft.owner_id = user.id
            draft.anon_session_id = None

        if drafts_to_transfer:
            await db_write.commit()

        await delete_session(anon_session_id, anonymous=True)

    # -------------------- Create new session --------------------
    session_id = await create_session(user)

    # -------------------- Track unique user --------------------
    unique_id = request.cookies.get("unique_id") or str(user.id)
    await increment_daily_user_stat(unique_id, db_write)

    return {
        "session_id": session_id,
        "unique_id": unique_id,
        "message": "Login successful",
    }


# ------------------------------
# Facebook login
# ------------------------------
@router.post("/facebook-login")
async def facebook_login(
    payload: FacebookLoginPayload,
    request: Request,  # <-- add Request
    db_read: AsyncSession = Depends(get_read_session),
    db_write: AsyncSession = Depends(get_write_session),
):
    # Extract anonymous_session_id from headers
    anon_session_id = None
    cookie_header = request.headers.get("cookie")
    if cookie_header:
        from http.cookies import SimpleCookie

        cookies = SimpleCookie(cookie_header)
        if "anonymous_session_id" in cookies:
            anon_session_id = cookies["anonymous_session_id"].value

    user_data = payload.user
    email = user_data.get("email")
    fb_id = user_data.get("id")

    if not email and not fb_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Facebook user data must include email or id",
        )

    email = email if email else f"fb_{fb_id}"
    first_name = process_name(user_data.get("first_name", ""))
    last_name = process_name(user_data.get("last_name", ""))

    profile_picture = (
        user_data.get("picture", {}).get("data", {}).get("url")
        if "picture" in user_data
        else None
    )

    result = await db_read.execute(select(User).filter_by(email=email))
    user = result.scalars().first()

    if not user:
        hashed_password = hash_password(secrets.token_urlsafe(16))
        user = User(
            email=email,
            hashed_password=hashed_password,
            role="customer",
            first_name=first_name,
            last_name=last_name,
            profile_picture=profile_picture,
        )
        db_write.add(user)
        await db_write.commit()
        await db_write.refresh(user)

    # -------------------- Claim drafts before deleting anon session --------------------
    if anon_session_id:
        result_user_invites = await db_read.execute(
            select(func.count(Invitation.id)).where(
                Invitation.owner_id == user.id,
                Invitation.status == InvitationStatus.DRAFT
            )
        )
        user_invite_count = result_user_invites.scalar() or 0


        result_drafts = await db_read.execute(
            select(Invitation).where(Invitation.anon_session_id == anon_session_id)
        )

        drafts = result_drafts.scalars().all()
        max_allowed = 3 - user_invite_count
        drafts_to_transfer = drafts[:max_allowed] if max_allowed > 0 else []

        for draft in drafts_to_transfer:
            draft = await db_write.merge(draft)
            draft.owner_id = user.id
            draft.anon_session_id = None

        if drafts_to_transfer:
            await db_write.commit()

        await delete_session(anon_session_id, anonymous=True)


    # -------------------- Create new session --------------------
    session_id = await create_session(user)

    unique_id = request.cookies.get("unique_id") or str(user.id)
    await increment_daily_user_stat(unique_id, db_write)

    return {
        "session_id": session_id,
        "unique_id": unique_id,
        "message": "Login successful",
    }
