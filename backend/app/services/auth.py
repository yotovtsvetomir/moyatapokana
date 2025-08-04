import uuid
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update

from app.db.models.user import User, RefreshToken, AccessToken
from app.db.session import get_read_session

# Environment config
SECRET_KEY = os.getenv("SECRET_KEY", "default-secret-key")
REFRESH_SECRET_KEY = os.getenv("REFRESH_SECRET_KEY", "default-refresh-secret-key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))

# Password context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 bearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")


# --- Password Hashing ---
def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


# --- ISO 8601 formatting ---
def isoformat_z(dt: datetime) -> str:
    return dt.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")


# --- Token creation ---
def create_access_token(
    data: dict, expires_delta: Optional[timedelta] = None
) -> Tuple[str, datetime, str]:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    expire = expire.replace(tzinfo=timezone.utc)
    jti = str(uuid.uuid4())
    to_encode.update({"exp": expire, "jti": jti})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt, expire, jti


def create_refresh_token(
    data: dict, expires_delta: Optional[timedelta] = None
) -> Tuple[str, datetime, str]:
    to_encode = data.copy()
    expire = datetime.utcnow() + (
        expires_delta or timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )
    expire = expire.replace(tzinfo=timezone.utc)
    jti = str(uuid.uuid4())
    to_encode.update({"exp": expire, "jti": jti})
    encoded_jwt = jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt, expire, jti


# --- Token Persistence ---
async def save_refresh_token(
    db: AsyncSession, user_id: int, token: str, jti: str, expires_at: datetime
) -> None:
    db_token = RefreshToken(
        user_id=user_id,
        token=token,
        jti=jti,
        issued_at=datetime.utcnow(),
        expires_at=expires_at,
        revoked=False,
    )
    db.add(db_token)
    await db.commit()


async def save_access_token(
    db: AsyncSession, user_id: int, token: str, jti: str, expires_at: datetime
) -> None:
    db_token = AccessToken(
        user_id=user_id,
        token=token,
        jti=jti,
        issued_at=datetime.utcnow(),
        expires_at=expires_at,
        revoked=False,
    )
    db.add(db_token)
    await db.commit()


async def revoke_all_tokens_for_user(db: AsyncSession, user_id: int) -> None:
    await db.execute(
        update(RefreshToken).where(RefreshToken.user_id == user_id).values(revoked=True)
    )
    await db.execute(
        update(AccessToken).where(AccessToken.user_id == user_id).values(revoked=True)
    )
    await db.commit()


async def is_refresh_token_valid(db: AsyncSession, jti: str, user_id: int) -> bool:
    result = await db.execute(
        select(RefreshToken).filter(
            RefreshToken.jti == jti,
            RefreshToken.user_id == user_id,
            RefreshToken.revoked.is_(False),
            RefreshToken.expires_at > datetime.utcnow(),
        )
    )
    token = result.scalars().first()
    return token is not None


# --- Auth Flow ---
async def get_current_user(
    token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_read_session)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        jti: str = payload.get("jti")
        if username is None or jti is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    result = await db.execute(select(User).filter(User.username == username))
    user = result.scalars().first()
    if user is None:
        raise credentials_exception

    token_result = await db.execute(
        select(AccessToken).filter(
            AccessToken.jti == jti,
            AccessToken.user_id == user.id,
            RefreshToken.revoked.is_(False),
            AccessToken.expires_at > datetime.utcnow(),
        )
    )
    db_token = token_result.scalars().first()
    if db_token is None:
        raise credentials_exception

    return user


async def authenticate_user(username: str, password: str, db: AsyncSession):
    result = await db.execute(select(User).filter(User.username == username))
    user = result.scalars().first()
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


# --- Social Login ---
async def handle_social_login(email: str, db: AsyncSession) -> dict:
    result = await db.execute(select(User).filter(User.username == email))
    user = result.scalars().first()

    random_password = secrets.token_urlsafe(32)
    hashed_random_password = hash_password(random_password)

    if not user:
        user = User(
            username=email, hashed_password=hashed_random_password, role="customer"
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token_data = {"sub": user.username, "role": user.role}

    access_token, access_exp, access_jti = create_access_token(token_data)
    refresh_token, refresh_exp, refresh_jti = create_refresh_token(token_data)

    await save_access_token(db, user.id, access_token, access_jti, access_exp)
    await save_refresh_token(db, user.id, refresh_token, refresh_jti, refresh_exp)

    return {
        "access_token": access_token,
        "access_token_expires": isoformat_z(access_exp),
        "refresh_token": refresh_token,
        "refresh_token_expires": isoformat_z(refresh_exp),
        "token_type": "bearer",
    }
