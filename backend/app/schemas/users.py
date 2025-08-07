import re
from pydantic import BaseModel, EmailStr, validator
from datetime import datetime
from uuid import UUID
from typing import Optional


# --- User Models ---


class UserCreate(BaseModel):
    username: EmailStr
    password: str

    @validator("password")
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError("Паролата трябва да е поне 8 символа")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Паролата трябва да съдържа поне една главна буква")
        if not re.search(r"[a-z]", v):
            raise ValueError("Паролата трябва да съдържа поне една малка буква")
        if not re.search(r"\d", v):
            raise ValueError("Паролата трябва да съдържа поне една цифра")
        if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", v):
            raise ValueError("Паролата трябва да съдържа поне един специален символ")
        return v


class UserRead(BaseModel):
    id: int
    username: EmailStr

    class Config:
        orm_mode = True


class UserLogin(BaseModel):
    username: EmailStr
    password: str


# --- Token Exchange Models ---


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class Token(BaseModel):
    access_token: str
    access_token_expires: datetime
    refresh_token: str
    refresh_token_expires: datetime
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


# --- Stored Token Models ---


class AccessTokenRead(BaseModel):
    id: UUID
    user_id: int
    jti: str
    token: str
    issued_at: datetime
    expires_at: datetime
    revoked: bool

    class Config:
        orm_mode = True


class RefreshTokenRead(BaseModel):
    id: UUID
    user_id: int
    jti: str
    token: str
    issued_at: datetime
    expires_at: datetime
    revoked: bool

    class Config:
        orm_mode = True
