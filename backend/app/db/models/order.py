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


class CurrencyRate(Base):
    __tablename__ = "currency_rates"

    id = Column(Integer, primary_key=True, index=True)
    currency = Column(String(3), unique=True, nullable=False)  # ISO code
    rate_to_bgn = Column(Numeric(10, 4), nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# -------------------- Price Tier --------------------
class PriceTier(Base):
    __tablename__ = "price_tiers"

    id = Column(Integer, primary_key=True, index=True)
    price = Column(Numeric(10, 2), nullable=False)
    duration_days = Column(Integer, nullable=False)
    currency = Column(String(3), nullable=False, default="BGN")
    active = Column(Boolean, default=True)

    # Relationships
    orders = relationship("Order", back_populates="price_tier")

    def __str__(self):
        return self.price


# -------------------- Order --------------------
class OrderStatus(PyEnum):
    STARTED = "started"
    PAID = "paid"
    CANCELLED = "cancelled"


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(16), unique=True, index=True, nullable=False)

    # Customer info (optional)
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    customer_name = Column(String, nullable=True)
    customer_email = Column(String, nullable=True)

    # Invitation info
    invitation_id = Column(Integer, ForeignKey("invitations.id"), nullable=False)
    invitation_title = Column(String, nullable=True)
    invitation = relationship("Invitation")

    # Payment info
    total_price = Column(Numeric(10, 2), nullable=False)
    paid = Column(Boolean, default=False)
    paid_price = Column(Numeric(10, 2), nullable=True)
    paid_at = Column(DateTime, nullable=True)
    status = Column(Enum(OrderStatus), default=OrderStatus.STARTED)
    currency = Column(String(3), nullable=False, default="BGN")

    # Price tier
    price_tier_id = Column(Integer, ForeignKey("price_tiers.id"), nullable=True)
    price_tier = relationship("PriceTier", back_populates="orders")

    # Stripe payment
    stripe_payment_intent = Column(String, nullable=True)
    stripe_session_id = Column(String, nullable=True)

    # Optional voucher
    voucher_id = Column(Integer, ForeignKey("vouchers.id"), nullable=True)
    voucher = relationship("Voucher")
    discount_amount = Column(Numeric(10, 2), nullable=True)
    original_price = Column(Numeric(10, 2), nullable=True)

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

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def __str__(self):
        return self.order_number


# -------------------- Voucher --------------------
class DiscountType(str, PyEnum):
    PERCENT = "percent"
    FIXED = "fixed"


class Voucher(Base):
    __tablename__ = "vouchers"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False)
    discount_type = Column(Enum(DiscountType), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)

    currency = Column(String(3), nullable=True, default="BGN")

    customer_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    usage_limit = Column(Integer, nullable=True)
    used_count = Column(Integer, default=0)

    valid_from = Column(DateTime, default=datetime.utcnow)
    valid_until = Column(DateTime, default=datetime.utcnow)
    active = Column(Boolean, default=True)

    # Relationships
    orders = relationship("Order", back_populates="voucher")

    def __str__(self):
        return self.code
