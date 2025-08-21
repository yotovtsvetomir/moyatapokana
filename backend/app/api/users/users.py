import os
import aiodns
import json
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Cookie

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

from app.core.permissions import require_role
from app.core.redis_client import get_redis_client
from app.db.session import get_read_session, get_write_session
from app.db.models.user import User, UserActivity, PasswordResetToken
from app.schemas.users import (
    UserRead,
    UserLogin,
    UserCreate,
    UserUpdate,
    PasswordResetRequest,
    PasswordResetConfirm,
)
from app.services.email import send_email
from app.services.s3.profile_picture import ProfilePictureService
from app.services.auth import (
    authenticate_user,
    create_session,
    update_session_data,
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
    user_create: UserCreate,
    db_read: AsyncSession = Depends(get_read_session),
    db_write: AsyncSession = Depends(get_write_session),
):
    if not await check_email_mx(user_create.email):
        raise HTTPException(status_code=400, detail="Имейлa е невалиден.")

    existing_user = (
        (await db_read.execute(select(User).where(User.email == user_create.email)))
        .scalars()
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400, detail="Акаунт с този имейл вече съществува."
        )

    user = await create_user(user_create, db_write)

    session_id = await create_session(
        user.id, user.email, user.role, user.first_name, user.last_name
    )
    expires_at = datetime.utcnow() + timedelta(seconds=SESSION_EXPIRE_SECONDS)

    return {
        "session_id": session_id,
        "message": "Registration successful",
        "expires_at": expires_at.isoformat() + "Z",
    }


@router.post("/login")
async def login(
    form_data: UserLogin,
    db_read: AsyncSession = Depends(get_read_session),
):
    user = await authenticate_user(form_data.email, form_data.password, db_read)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Невалидно име или парола",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.role != "customer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нямате разрешение да влезете в системата.",
        )

    session_id = await create_session(
        user.id, user.email, user.role, user.first_name, user.last_name
    )
    expires_at = datetime.utcnow() + timedelta(seconds=SESSION_EXPIRE_SECONDS)

    return {
        "session_id": session_id,
        "message": "Login successful",
        "expires_at": expires_at.isoformat() + "Z",
    }


@router.get("/me", response_model=UserRead)
async def get_me(
    session_data: dict = Depends(require_role("customer")),
    db_read: AsyncSession = Depends(get_read_session),
):
    email = session_data.get("email")

    result = await db_read.execute(select(User).filter(User.email == email))
    user = result.scalars().first()
    if user is None:
        raise HTTPException(status_code=401, detail="Нямате разрешение")

    return user


@router.patch("/me", response_model=UserRead)
async def update_profile(
    data: UserUpdate,
    session_data: dict = Depends(require_role("customer")),
    db_write: AsyncSession = Depends(get_write_session),
):
    email = session_data.get("email")

    result = await db_write.execute(select(User).filter(User.email == email))
    user = result.scalars().first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    user.first_name = data.first_name
    user.last_name = data.last_name

    if data.profile_picture:
        profile_service = ProfilePictureService()
        try:
            url = await profile_service.upload_profile_picture(data.profile_picture)
            user.profile_picture = url
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    db_write.add(user)
    await db_write.commit()
    await db_write.refresh(user)

    await update_session_data(
        session_data["session_id"], data.first_name, data.last_name
    )

    return user


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    session_id: str | None = Cookie(None),
    db_write: AsyncSession = Depends(get_write_session),
    _=Depends(require_role("customer")),
):
    if not session_id:
        raise HTTPException(status_code=401, detail="Няма намерена сесия")

    redis = await get_redis_client()
    key = f"user_session:{session_id}"
    raw_data = await redis.get(key)

    if raw_data:
        session_data = json.loads(raw_data)
        user_id = int(session_data["user_id"])

        activity = UserActivity(
            user_id=user_id,
            activity_type="logout",
            timestamp=datetime.now(timezone.utc).replace(tzinfo=None),
        )
        db_write.add(activity)
        await db_write.commit()

    await delete_session(session_id)
    return


@router.post("/refresh-session")
async def refresh_session(
    session_id: str | None = Cookie(None),
    _=Depends(require_role("customer")),
    db_write: AsyncSession = Depends(get_write_session),
):
    if not session_id:
        raise HTTPException(status_code=401, detail="Няма намерена сесия")

    updated = await extend_session_expiry(session_id)
    if not updated:
        raise HTTPException(
            status_code=401, detail="Грешка при обновяването на сесията"
        )

    return {"message": "Сесията е обновена", "session_id": session_id}


@router.post("/password-reset/request")
async def password_reset_request(
    request: PasswordResetRequest,
    db_read: AsyncSession = Depends(get_read_session),
    db_write: AsyncSession = Depends(get_write_session),
):
    result = await db_read.execute(select(User).filter(User.email == request.email))
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=404, detail="Акаунт с този имейл не съществува."
        )

    if user.role != "customer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нямате разрешение да извършите това действие.",
        )

    token = serializer.dumps(user.email, salt="password-reset-salt")
    reset_token = PasswordResetToken(user_id=user.id, token=token)
    db_write.add(reset_token)
    await db_write.commit()

    reset_link = f"{FRONTEND_BASE_URL}/password-reset/{token}/"

    subject = "Ресет на парола"
    body = f"Здравейте {user.email},\n\nНатиснете линка за да смените паролата:\n{reset_link}"
    send_email(to=user.email, subject=subject, body=body)

    return {"message": "Линк за смяна на паролата беше изпратен на имейла ви."}


@router.post("/password-reset/confirm")
async def password_reset_confirm(
    data: PasswordResetConfirm,
    db_write: AsyncSession = Depends(get_write_session),
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

    result = await db_write.execute(select(User).filter(User.email == email))
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=404, detail="Акаунт с този имейл не съществува."
        )

    if user.role != "customer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Нямате разрешение да извършите това действие.",
        )

    user.hashed_password = hash_password(data.new_password)
    reset_token.used = True

    await db_write.commit()

    return {"message": "Паролата беше сменена успешно."}
