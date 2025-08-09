import secrets
from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.models.user import User
from app.db.session import get_write_session, get_read_session
from app.services.auth import (
    create_access_token,
    create_refresh_token,
    save_access_token,
    save_refresh_token,
    hash_password,
)
import httpx
import os
from pydantic import BaseModel

router = APIRouter()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("FRONTEND_BASE_URL") + "/social-redirect"


class GoogleLoginPayload(BaseModel):
    id_token: str


@router.post("/google-login")
async def google_login(
    payload: GoogleLoginPayload,
    db_read: AsyncSession = Depends(get_read_session),
    db_write: AsyncSession = Depends(get_write_session),
):
    # Verify token with Google
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

    # Check audience matches your client id
    if data.get("aud") != GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid audience in token"
        )

    email = data.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email not available"
        )

    result = await db_read.execute(select(User).filter(User.username == email))
    user = result.scalars().first()

    hashed_password = hash_password(secrets.token_urlsafe(16))
    if not user:
        user = User(username=email, hashed_password=hashed_password, role="customer")
        db_write.add(user)
        await db_write.commit()
        await db_write.refresh(user)

    access_token, access_exp, access_jti = create_access_token(
        data={"sub": user.username, "role": user.role}
    )
    refresh_token, refresh_exp, refresh_jti = create_refresh_token(
        data={"sub": user.username, "role": user.role}
    )

    await save_access_token(db_write, user.id, access_token, access_jti, access_exp)
    await save_refresh_token(db_write, user.id, refresh_token, refresh_jti, refresh_exp)

    return {
        "access_token": access_token,
        "access_token_expires": access_exp.isoformat(),
        "refresh_token": refresh_token,
        "refresh_token_expires": refresh_exp.isoformat(),
        "token_type": "bearer",
    }
