import os
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Cookie
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.core.permissions import is_authenticated
from app.db.session import get_read_session, get_write_session
from app.db.models.user import User
from app.schemas.users import UserRead, UserCreate
from app.services.auth import (
    authenticate_user,
    create_session,
    delete_session,
    extend_session_expiry,
    create_user,
)

router = APIRouter()

SESSION_EXPIRE_SECONDS = int(os.getenv("SESSION_EXPIRE_SECONDS", 604800))
SESSION_COOKIE_NAME = os.getenv("SESSION_COOKIE_NAME", "session_id")
SECRET_KEY = os.getenv("SECRET_KEY", "default-secret-key")


@router.post("/")
async def register(
    user_create: UserCreate, db_write: AsyncSession = Depends(get_write_session)
):
    user = await create_user(user_create, db_write)
    session_id = await create_session(user.id, user.username, user.role)

    expires_at = datetime.utcnow() + timedelta(seconds=SESSION_EXPIRE_SECONDS)

    return {
        "session_id": session_id,
        "message": "Registration successful",
        "expires_at": expires_at.isoformat() + "Z",
    }


@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db_read: AsyncSession = Depends(get_read_session),
):
    user = await authenticate_user(form_data.username, form_data.password, db_read)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Невалидно име или парола",
            headers={"WWW-Authenticate": "Bearer"},
        )

    session_id = await create_session(user.id, user.username, user.role)
    expires_at = datetime.utcnow() + timedelta(seconds=SESSION_EXPIRE_SECONDS)

    return {
        "session_id": session_id,
        "message": "Login successful",
        "expires_at": expires_at.isoformat() + "Z",
    }


@router.get("/me", response_model=UserRead)
async def get_me(
    session_data: dict = Depends(is_authenticated),  # now using dependency
    db_read: AsyncSession = Depends(get_read_session),
):
    username = session_data.get("username")

    result = await db_read.execute(select(User).filter(User.username == username))
    user = result.scalars().first()
    if user is None:
        raise HTTPException(status_code=401, detail="Нямате разрешение")

    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    session_id: str | None = Cookie(None),
    _=Depends(is_authenticated),
):
    await delete_session(session_id)
    return


@router.post("/refresh-session")
async def refresh_session(
    session_id: str | None = Cookie(None),
    _=Depends(is_authenticated),
    db_write: AsyncSession = Depends(get_write_session),
):
    if not session_id:
        raise HTTPException(status_code=401, detail="No session found")

    updated = await extend_session_expiry(session_id)
    if not updated:
        raise HTTPException(status_code=401, detail="Session refresh failed")

    return {"message": "Session refreshed"}
