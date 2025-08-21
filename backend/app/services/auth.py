import os
import secrets
import json
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from passlib.context import CryptContext
from app.schemas.users import UserCreate
from app.db.models.user import User
from app.core.redis_client import get_redis_client

SESSION_EXPIRE_SECONDS = 60 * 60 * 24 * 7  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
PEPPER = os.getenv("PEPPER")


def hash_password(password: str) -> str:
    return pwd_context.hash(password + PEPPER)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password + PEPPER, hashed_password)


def isoformat_z(dt: datetime) -> str:
    return dt.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")


async def create_user(user_create: UserCreate, db: AsyncSession) -> User:
    existing_user = (
        (await db.execute(select(User).filter(User.email == user_create.email)))
        .scalars()
        .first()
    )
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Акаунт с този имейл вече съществува",
        )

    hashed_password = hash_password(user_create.password)
    new_user = User(
        email=user_create.email,
        hashed_password=hashed_password,
        first_name=user_create.first_name,
        last_name=user_create.last_name,
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user


async def authenticate_user(email: str, password: str, db: AsyncSession) -> User | None:
    result = await db.execute(select(User).filter(User.email == email))
    user = result.scalars().first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


async def create_session(
    user_id: int,
    email: str,
    role: str,
    first_name: str,
    last_name: str,
    db: AsyncSession | None = None,
) -> str:
    redis = await get_redis_client()
    session_id = secrets.token_urlsafe(32)
    now = datetime.utcnow()

    session_data = {
        "user_id": str(user_id),
        "email": email,
        "first_name": first_name,
        "last_name": last_name,
        "role": role,
        "created_at": isoformat_z(now),
    }

    await redis.set(f"user_session:{session_id}", json.dumps(session_data))
    await redis.expire(f"user_session:{session_id}", SESSION_EXPIRE_SECONDS)

    # Log activity if a DB session is provided and role is customer
    if db and role == "customer":
        from app.db.models.user import UserActivity

        activity = UserActivity(user_id=user_id, activity_type="login", timestamp=now)
        db.add(activity)
        await db.commit()

    return session_id


async def update_session_data(session_id: str, first_name: str, last_name: str) -> None:
    redis = await get_redis_client()
    key = f"user_session:{session_id}"
    raw_data = await redis.get(key)
    if not raw_data:
        raise HTTPException(status_code=401, detail="Session not found")

    session_data = json.loads(raw_data)
    session_data["first_name"] = first_name
    session_data["last_name"] = last_name

    await redis.set(key, json.dumps(session_data))


async def get_session(session_id: str) -> dict | None:
    redis = await get_redis_client()
    raw_data = await redis.get(f"user_session:{session_id}")
    if not raw_data:
        return None
    return json.loads(raw_data)


async def delete_session(session_id: str) -> None:
    redis = await get_redis_client()
    await redis.delete(f"user_session:{session_id}")


async def extend_session_expiry(session_id: str) -> bool:
    redis = await get_redis_client()
    key = f"user_session:{session_id}"
    exists = await redis.exists(key)
    if not exists:
        return False

    await redis.expire(key, SESSION_EXPIRE_SECONDS)
    return True
