from app.db.session import Base
from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    ForeignKey,
    Numeric,
    Enum,
)
from sqlalchemy.orm import relationship
from datetime import datetime
from enum import Enum as PyEnum


class OrderStatus(PyEnum):
    STARTED = "started"
    PAID = "paid"
    CANCELLED = "cancelled"


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(16), unique=True, index=True, nullable=False)

    # Customer info (optional if anon)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    customer_name = Column(String, nullable=True)
    customer_email = Column(String, nullable=True)

    # Invitation info
    invitation_id = Column(Integer, ForeignKey("invitations.id"), nullable=False)
    invitation_title = Column(String, nullable=True)
    invitation = relationship("Invitation")

    # Payment
    total_price = Column(Numeric(10, 2), nullable=False)
    paid = Column(Boolean, default=False)
    paid_price = Column(Numeric(10, 2), nullable=True)
    paid_at = Column(DateTime, nullable=True)
    status = Column(Enum(OrderStatus), default=OrderStatus.STARTED)

    stripe_payment_intent = Column(String, nullable=True)
    stripe_session_id = Column(String, nullable=True)

    # Optional voucher
    voucher_id = Column(Integer, ForeignKey("vouchers.id"), nullable=True)
    discount_amount = Column(Numeric(10, 2), nullable=True)
    original_price = Column(Numeric(10, 2), nullable=True)
    voucher = relationship("Voucher")

    # Duration
    duration_days = Column(Integer, nullable=True)

    # Billing info (optional)
    billing_name = Column(String, nullable=True)
    billing_address = Column(String, nullable=True)
    billing_city = Column(String, nullable=True)
    billing_zip = Column(String, nullable=True)
    billing_country = Column(String, nullable=True)
    is_company = Column(Boolean, default=False)
    company_name = Column(String, nullable=True)
    vat_number = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class DiscountType(str, PyEnum):
    PERCENT = "percent"
    FIXED = "fixed"


class Voucher(Base):
    __tablename__ = "vouchers"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False)
    discount_type = Column(Enum(DiscountType), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)

    customer_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    usage_limit = Column(Integer, nullable=True)
    used_count = Column(Integer, default=0)

    valid_from = Column(DateTime, default=datetime.utcnow)
    valid_until = Column(DateTime, default=datetime.utcnow)
    active = Column(Boolean, default=True)

    # backref for orders
    orders = relationship("Order", back_populates="voucher")
