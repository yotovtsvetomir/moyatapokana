import os
import secrets
import json
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from passlib.context import CryptContext
from app.schemas.user import UserCreate
from app.db.models.user import User
from app.core.redis_client import get_redis_client

SESSION_EXPIRE_SECONDS = 60 * 60 * 24 * 7  # 7 days
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
PEPPER = os.getenv("PEPPER")


def isoformat_z(dt: datetime) -> str:
    return dt.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")


def hash_password(password: str) -> str:
    return pwd_context.hash(password + PEPPER)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password + PEPPER, hashed_password)


# ------------------------------
# User management
# ------------------------------
async def create_user(user_create: UserCreate, db: AsyncSession) -> User:
    result = await db.execute(select(User).filter(User.email == user_create.email))
    existing_user = result.scalars().first()
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
    if not user or not verify_password(password, user.hashed_password):
        return None
    return user


# ------------------------------
# Session management
# ------------------------------
async def _set_session(key: str, data: dict):
    redis = await get_redis_client()
    await redis.set(key, json.dumps(data))
    await redis.expire(key, SESSION_EXPIRE_SECONDS)


async def create_session(user: User) -> str:
    """Create a regular user session"""
    redis = await get_redis_client()
    session_id = secrets.token_urlsafe(32)
    now = datetime.utcnow()
    session_data = {
        "user_id": str(user.id),
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": user.role,
        "profile_picture": user.profile_picture,
        "created_at": isoformat_z(now),
    }
    await _set_session(f"user_session:{session_id}", session_data)
    return session_id


async def create_anonymous_session() -> str:
    """Create an anonymous session"""
    redis = await get_redis_client()
    anonymous_session_id = secrets.token_urlsafe(32)
    now = datetime.utcnow()
    session_data = {
        "user_id": None,
        "role": "anonymous",
        "created_at": isoformat_z(now),
    }
    await _set_session(f"anonymous_session:{anonymous_session_id}", session_data)
    return anonymous_session_id


async def get_session(session_id: str, anonymous: bool = False) -> dict | None:
    redis = await get_redis_client()
    key = f"{'anonymous_' if anonymous else 'user_'}session:{session_id}"
    raw_data = await redis.get(key)
    if not raw_data:
        return None
    return json.loads(raw_data)


async def update_session_data(session_id: str, user: User):
    """Update user session data"""
    now = datetime.utcnow()
    session_data = {
        "user_id": str(user.id),
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "role": user.role,
        "profile_picture": user.profile_picture,
        "updated_at": isoformat_z(now),
    }
    await _set_session(f"user_session:{session_id}", session_data)


async def delete_session(session_id: str, anonymous: bool = False):
    redis = await get_redis_client()
    key = f"{'anonymous_' if anonymous else 'user_'}session:{session_id}"
    await redis.delete(key)


async def extend_session_expiry(session_id: str, anonymous: bool = False) -> bool:
    redis = await get_redis_client()
    key = f"{'anonymous_' if anonymous else 'user_'}session:{session_id}"
    if not await redis.exists(key):
        return False
    await redis.expire(key, SESSION_EXPIRE_SECONDS)
    return True
