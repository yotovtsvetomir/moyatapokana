import re
from pydantic import BaseModel, EmailStr, validator, constr
from typing import Optional


# --- User Models ---


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str

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
    email: EmailStr
    first_name: str
    last_name: str
    profile_picture: Optional[str] = None

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    first_name: constr(min_length=1)
    last_name: constr(min_length=1)
    profile_picture: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

    @validator("new_password")
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
