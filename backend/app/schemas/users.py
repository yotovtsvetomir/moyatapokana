import re
from pydantic import BaseModel, EmailStr, validator


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

    model_config = {"from_attributes": True}


class UserLogin(BaseModel):
    username: EmailStr
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
