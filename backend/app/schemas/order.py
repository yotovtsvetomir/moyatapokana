from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from enum import Enum


class OrderStatus(str, Enum):
    STARTED = "started"
    PAID = "paid"
    CANCELLED = "cancelled"


# -------------------- Base --------------------
class OrderBase(BaseModel):
    customer_name: Optional[str]
    customer_email: Optional[EmailStr]
    billing_name: Optional[str]
    billing_address: Optional[str]
    billing_city: Optional[str]
    billing_zip: Optional[str]
    billing_country: Optional[str]
    is_company: Optional[bool] = False
    company_name: Optional[str]
    vat_number: Optional[str]
    voucher_id: Optional[int]


# -------------------- Create --------------------
class OrderCreate(OrderBase):
    invitation_id: int
    total_price: Optional[float] = 0


# -------------------- Update Price + Voucher --------------------
class OrderUpdatePrice(BaseModel):
    total_price: float
    voucher_code: Optional[str]


# -------------------- Update --------------------
class OrderUpdate(OrderBase):
    status: Optional[OrderStatus]
    paid: Optional[bool]
    paid_price: Optional[float]
    paid_at: Optional[datetime]
    duration_days: Optional[int]


# -------------------- Read / Response --------------------
class OrderRead(OrderBase):
    id: int
    order_number: str
    invitation_id: int
    invitation_title: Optional[str]
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
    created_at: datetime
    updated_at: datetime
