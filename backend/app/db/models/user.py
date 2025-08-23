from app.db.session import Base
from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, Date
from datetime import datetime


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=False, default="")
    last_name = Column(String, nullable=False, default="")
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="customer")
    profile_picture = Column(String, nullable=True, default=None)


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True)
    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    token = Column(String, unique=True, nullable=False)
    used = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class DailyUserStats(Base):
    __tablename__ = "daily_user_stats"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, default=datetime.utcnow().date, index=True)
    user_type = Column(String, default="customer")  # "customer" or "anonymous"
    active_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
