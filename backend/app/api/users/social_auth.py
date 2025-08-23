from fastapi import APIRouter, HTTPException, Depends, status, Cookie
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.models.user import User
from app.db.session import get_write_session, get_read_session
from app.services.auth import create_session, hash_password, delete_session
import httpx
import os
from pydantic import BaseModel
import secrets

router = APIRouter()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
REDIRECT_URI = os.getenv("FRONTEND_BASE_URL") + "/social-redirect"


class GoogleLoginPayload(BaseModel):
    id_token: str


class FacebookLoginPayload(BaseModel):
    user: dict


# ------------------------------
# Google login
# ------------------------------
@router.post("/google-login")
async def google_login(
    payload: GoogleLoginPayload,
    anonymous_session_id: str | None = Cookie(None),
    db_read: AsyncSession = Depends(get_read_session),
    db_write: AsyncSession = Depends(get_write_session),
):
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

    if data.get("aud") != GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid audience in token"
        )

    email = data.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email not available"
        )

    first_name = data.get("given_name", "")
    last_name = data.get("family_name", "")
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

    # Delete anonymous session if it exists
    if anonymous_session_id:
        await delete_session(anonymous_session_id, anonymous=True)

    session_id = await create_session(user)

    return {
        "session_id": session_id,
        "message": "Login successful",
    }


# ------------------------------
# Facebook login
# ------------------------------
@router.post("/facebook-login")
async def facebook_login(
    payload: FacebookLoginPayload,
    anonymous_session_id: str | None = Cookie(None),
    db_read: AsyncSession = Depends(get_read_session),
    db_write: AsyncSession = Depends(get_write_session),
):
    user_data = payload.user
    email = user_data.get("email")
    fb_id = user_data.get("id")

    if not email and not fb_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Facebook user data must include email or id",
        )

    email = email if email else f"fb_{fb_id}"
    first_name = user_data.get("first_name", "")
    last_name = user_data.get("last_name", "")

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

    # Delete anonymous session if it exists
    if anonymous_session_id:
        await delete_session(anonymous_session_id, anonymous=True)

    session_id = await create_session(user)

    return {
        "session_id": session_id,
        "message": "Login successful",
    }
