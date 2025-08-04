import os
from fastapi import APIRouter, Depends, HTTPException, status, Cookie, Header
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from jose import JWTError, jwt

from app.db.session import get_write_session, get_read_session
from app.db.models.user import User
from app.schemas.users import (
    UserCreate,
    UserRead,
    Token as TokenSchema,
    RefreshTokenRequest,
)
from app.services.auth import (
    save_access_token,
    save_refresh_token,
    is_refresh_token_valid,
    authenticate_user,
    revoke_all_tokens_for_user,
    create_access_token,
    create_refresh_token,
    isoformat_z,
    hash_password,
)

router = APIRouter(prefix="/users", tags=["users"])

SECRET_KEY = os.getenv("SECRET_KEY", "default-secret-key")
REFRESH_SECRET_KEY = os.getenv("REFRESH_SECRET_KEY", "default-refresh-secret-key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")


@router.post("", response_model=TokenSchema, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_in: UserCreate, db: AsyncSession = Depends(get_write_session)
):
    result = await db.execute(select(User).filter(User.username == user_in.username))
    user = result.scalars().first()
    if user:
        raise HTTPException(
            status_code=400, detail="Акаунт с този имейл вече е регистриран."
        )

    hashed_pwd = hash_password(user_in.password)
    new_user = User(
        username=user_in.username, hashed_password=hashed_pwd, role="customer"
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Generate tokens
    access_token, access_exp, access_jti = create_access_token(
        data={"sub": new_user.username, "role": new_user.role}
    )
    refresh_token, refresh_exp, refresh_jti = create_refresh_token(
        data={"sub": new_user.username, "role": new_user.role}
    )

    # Save tokens to DB
    await save_access_token(db, new_user.id, access_token, access_jti, access_exp)
    await save_refresh_token(db, new_user.id, refresh_token, refresh_jti, refresh_exp)

    return {
        "access_token": access_token,
        "access_token_expires": isoformat_z(access_exp),
        "refresh_token": refresh_token,
        "refresh_token_expires": isoformat_z(refresh_exp),
        "token_type": "bearer",
    }


@router.get("/me", response_model=UserRead)
async def get_me(
    authorization: str | None = Header(None),
    access_token: str = Cookie(None),
    db: AsyncSession = Depends(get_read_session),
):
    token = None

    if authorization and authorization.lower().startswith("bearer "):
        token = authorization[7:]
    elif access_token:
        token = access_token
    else:
        raise HTTPException(status_code=401, detail="Невалиден токен")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Невалиден токен")
    except JWTError:
        raise HTTPException(status_code=401, detail="Невалиден токен")

    result = await db.execute(select(User).filter(User.username == username))
    user = result.scalars().first()
    if user is None:
        raise HTTPException(status_code=401, detail="Невалиден токен")

    return user


@router.post("/login", response_model=TokenSchema)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db_read: AsyncSession = Depends(get_read_session),
    db_write: AsyncSession = Depends(get_write_session),
):
    user = await authenticate_user(form_data.username, form_data.password, db_read)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Невалидно име или парола",
            headers={"WWW-Authenticate": "Bearer"},
        )

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
        "access_token_expires": isoformat_z(access_exp),
        "refresh_token": refresh_token,
        "refresh_token_expires": isoformat_z(refresh_exp),
        "token_type": "bearer",
    }


@router.post("/refresh", response_model=TokenSchema)
async def refresh_access_token(
    request: RefreshTokenRequest,
    db_read: AsyncSession = Depends(get_read_session),
    db_write: AsyncSession = Depends(get_write_session),
):
    refresh_token = request.refresh_token
    try:
        payload = jwt.decode(refresh_token, REFRESH_SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        jti: str = payload.get("jti")
        if username is None or jti is None:
            raise HTTPException(status_code=401, detail="Нямате разрешение")
    except JWTError:
        raise HTTPException(status_code=401, detail="Нямате разрешение")

    result = await db_read.execute(select(User).filter(User.username == username))
    user = result.scalars().first()
    if user is None:
        raise HTTPException(status_code=401, detail="Нямате разрешение")

    if not await is_refresh_token_valid(db_read, jti, user.id):
        raise HTTPException(status_code=401, detail="Нямате разрешение")

    # revoke_all_tokens_for_user is a write operation, use write session
    await revoke_all_tokens_for_user(db_write, user.id)

    access_token, access_exp, access_jti = create_access_token(
        data={"sub": user.username, "role": user.role}
    )
    new_refresh_token, refresh_exp, refresh_jti = create_refresh_token(
        data={"sub": user.username, "role": user.role}
    )

    await save_access_token(db_write, user.id, access_token, access_jti, access_exp)
    await save_refresh_token(
        db_write, user.id, new_refresh_token, refresh_jti, refresh_exp
    )

    return {
        "access_token": access_token,
        "access_token_expires": isoformat_z(access_exp),
        "refresh_token": new_refresh_token,
        "refresh_token_expires": isoformat_z(refresh_exp),
        "token_type": "bearer",
    }


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    access_token: str = Cookie(None),
    db_write: AsyncSession = Depends(get_write_session),
):
    if not access_token:
        raise HTTPException(status_code=401, detail="Нямате разрешение")

    try:
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Нямате разрешение")
    except JWTError:
        raise HTTPException(status_code=401, detail="Нямате разрешение")

    result = await db_write.execute(select(User).filter(User.username == username))
    user = result.scalars().first()
    if user is None:
        raise HTTPException(status_code=401, detail="Нямате разрешение")

    await revoke_all_tokens_for_user(db_write, user.id)

    # Return 204 No Content for successful logout with no body
    return
