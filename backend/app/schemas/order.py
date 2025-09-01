from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from enum import Enum


# -------------------- Enums --------------------
class OrderStatus(str, Enum):
    STARTED = "started"
    PAID = "paid"
    CANCELLED = "cancelled"


# -------------------- Price Tier Schemas --------------------
class PriceTierRead(BaseModel):
    id: int
    price: float
    duration_days: int
    currency: str
    active: bool

    model_config = {"from_attributes": True}


class PriceTierReadWithChoices(BaseModel):
    tiers: list[PriceTierRead]
    currencies: list[str]

    model_config = {"from_attributes": True}


# -------------------- Base --------------------
class OrderBase(BaseModel):
    customer_name: Optional[str] = ""
    customer_email: Optional[EmailStr] = ""
    billing_name: Optional[str] = ""
    billing_address: Optional[str] = ""
    billing_city: Optional[str] = ""
    billing_zip: Optional[str] = ""
    billing_country: Optional[str] = ""
    is_company: Optional[bool] = False
    company_name: Optional[str] = ""
    vat_number: Optional[str] = ""
    voucher_id: Optional[int] = ""


# -------------------- Create --------------------
class OrderCreate(OrderBase):
    invitation_id: int


# -------------------- Update Price + Voucher --------------------
class OrderUpdatePrice(BaseModel):
    duration_days: int
    currency: Optional[str] = "BGN"
    voucher_code: Optional[str]


# -------------------- Update --------------------
class OrderUpdate(OrderBase):
    status: Optional[OrderStatus]
    paid: Optional[bool]
    paid_price: Optional[float]
    paid_at: Optional[datetime]
    duration_days: Optional[int]
    price_tier_id: Optional[int]


# -------------------- Read / Response --------------------
class OrderRead(OrderBase):
    id: int
    order_number: str
    invitation_id: int
    invitation_title: Optional[str]
    invitation_wallpaper: Optional[str]
    total_price: float
    paid: bool
    paid_price: Optional[float]
    paid_at: Optional[datetime]
    status: OrderStatus
    stripe_payment_intent: Optional[str]
    stripe_session_id: Optional[str]
    discount_amount: Optional[float]
    original_price: Optional[float]
    duration_days: Optional[int]
    currency: str  # <--- new field
    created_at: datetime
    updated_at: datetime
    price_tier: Optional[PriceTierRead]

    model_config = {"from_attributes": True}
