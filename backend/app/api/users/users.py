import os
import aiodns
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status, Cookie
from fastapi.security import OAuth2PasswordRequestForm

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

from app.core.permissions import is_authenticated
from app.db.session import get_read_session, get_write_session
from app.db.models.user import User, PasswordResetToken
from app.schemas.users import (
    UserRead,
    UserCreate,
    PasswordResetRequest,
    PasswordResetConfirm,
)
from app.services.email import send_email
from app.services.auth import (
    authenticate_user,
    create_session,
    delete_session,
    extend_session_expiry,
    create_user,
    hash_password,
)

router = APIRouter()

SESSION_EXPIRE_SECONDS = int(os.getenv("SESSION_EXPIRE_SECONDS", 604800))
SESSION_COOKIE_NAME = os.getenv("SESSION_COOKIE_NAME", "session_id")
SECRET_KEY = os.getenv("SECRET_KEY", "default-secret-key")
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000")

RESET_TOKEN_EXPIRE_SECONDS = 900
serializer = URLSafeTimedSerializer(SECRET_KEY)


async def check_email_mx(email: str) -> bool:
    domain = email.split("@")[-1]
    resolver = aiodns.DNSResolver()
    try:
        result = await resolver.query(domain, "MX")
        return len(result) > 0
    except aiodns.error.DNSError:
        return False


@router.post("/")
async def register(
    user_create: UserCreate, db_write: AsyncSession = Depends(get_write_session)
):
    if not await check_email_mx(user_create.username):
        raise HTTPException(status_code=400, detail="Имейлa е невалиден.")

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
    session_data: dict = Depends(is_authenticated),
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
        raise HTTPException(status_code=401, detail="Няма намерена сесия")

    updated = await extend_session_expiry(session_id)
    if not updated:
        raise HTTPException(
            status_code=401, detail="Грешка при обновяването на сесията"
        )

    return {"message": "Сесията е обновена"}


@router.post("/password-reset/request")
async def password_reset_request(
    request: PasswordResetRequest,
    db_read: AsyncSession = Depends(get_read_session),
    db_write: AsyncSession = Depends(get_write_session),
):
    result = await db_read.execute(select(User).filter(User.username == request.email))
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=404, detail="Акаунт с този имейл не съществува."
        )

    token = serializer.dumps(user.username, salt="password-reset-salt")
    reset_token = PasswordResetToken(user_id=user.id, token=token)
    db_write.add(reset_token)
    await db_write.commit()

    reset_link = f"{FRONTEND_BASE_URL}/password-reset/{token}/"

    subject = "Ресет на парола"
    body = f"Здравейте {user.username},\n\nНатиснете линка за да смените паролата:\n{reset_link}"
    send_email(to=user.username, subject=subject, body=body)

    return {"message": "Линк за смяна на паролата беше изпратен на имейла ви."}


@router.post("/password-reset/confirm")
async def password_reset_confirm(
    data: PasswordResetConfirm,
    db_write: AsyncSession = Depends(get_write_session),  # use only write session
):
    try:
        email = serializer.loads(
            data.token, salt="password-reset-salt", max_age=RESET_TOKEN_EXPIRE_SECONDS
        )
    except SignatureExpired:
        raise HTTPException(status_code=400, detail="Невалиден токен")
    except BadSignature:
        raise HTTPException(status_code=400, detail="Невалиден токен")

    result = await db_write.execute(
        select(PasswordResetToken).where(
            (PasswordResetToken.token == data.token) & (~PasswordResetToken.used)
        )
    )
    reset_token = result.scalars().first()
    if not reset_token:
        raise HTTPException(status_code=400, detail="Невалиден токен")

    result = await db_write.execute(select(User).filter(User.username == email))
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=404, detail="Акаунт с този имейл не съществува."
        )

    user.hashed_password = hash_password(data.new_password)
    reset_token.used = True

    await db_write.commit()

    return {"message": "Паролата беше сменена успешно."}
