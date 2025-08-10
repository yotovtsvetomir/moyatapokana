from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.models.user import User
from app.db.session import get_write_session, get_read_session
from app.services.auth import create_session, hash_password
import httpx
import os
from pydantic import BaseModel
import secrets

router = APIRouter()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
REDIRECT_URI = os.getenv("FRONTEND_BASE_URL") + "/social-redirect"


class GoogleLoginPayload(BaseModel):
    id_token: str


@router.post("/google-login")
async def google_login(
    payload: GoogleLoginPayload,
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

    result = await db_read.execute(select(User).filter_by(username=email))
    user = result.scalars().first()

    if not user:
        # Create new user with random password (won't be used)
        hashed_password = hash_password(secrets.token_urlsafe(16))
        user = User(username=email, hashed_password=hashed_password, role="customer")
        db_write.add(user)
        await db_write.commit()
        await db_write.refresh(user)

    session_id = await create_session(user.id, user.username, user.role)

    return {
        "session_id": session_id,
        "message": "Login successful",
    }
