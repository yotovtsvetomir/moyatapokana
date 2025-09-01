import os
import random
import string
import stripe
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import distinct
from fastapi.responses import StreamingResponse
from io import BytesIO
from jinja2 import Environment, FileSystemLoader, select_autoescape
from weasyprint import HTML

from app.db.session import get_write_session, get_read_session
from app.db.models.order import Order, OrderStatus, Voucher, PriceTier, CurrencyRate
from app.db.models.invitation import Invitation
from app.schemas.order import (
    OrderCreate,
    OrderRead,
    OrderUpdatePrice,
    PriceTierRead,
    PriceTierReadWithChoices,
)
from app.core.permissions import require_role
from app.core.settings import settings

router = APIRouter()

TEMPLATE_DIR = os.path.join("app", "templates", "orders")
env = Environment(
    loader=FileSystemLoader(TEMPLATE_DIR),
    autoescape=select_autoescape(["html", "xml"]),
)

stripe.api_key = settings.STRIPE_SECRET_KEY


def format_order_dates(order: Order) -> dict:
    """Return order data with formatted dates for template."""
    return {
        **order.__dict__,
        "created_at": order.created_at.strftime("%d.%m.%Y") if order.created_at else "",
        "paid_at": order.paid_at.strftime("%d.%m.%Y") if order.paid_at else "",
        "invitation": {
            **order.invitation.__dict__,
            "live_from": order.invitation.live_from.strftime("%d.%m.%Y %H:%M")
            if order.invitation.live_from
            else "",
            "live_until": order.invitation.live_until.strftime("%d.%m.%Y %H:%M")
            if order.invitation.live_until
            else "",
        }
        if order.invitation
        else {},
    }


# -------------------- CREATE ORDER --------------------
@router.post("/create", response_model=OrderRead)
async def create_order_route(
    payload: OrderCreate,
    current_user: dict = Depends(require_role("customer")),
    write_db: AsyncSession = Depends(get_write_session),
    read_db: AsyncSession = Depends(get_read_session),
):
    customer_email = current_user["email"]
    customer_name = current_user["first_name"] + " " + current_user["last_name"]

    # Check for existing STARTED order
    result = await read_db.execute(
        select(Order)
        .options(selectinload(Order.price_tier), selectinload(Order.voucher))
        .where(
            Order.invitation_id == payload.invitation_id,
            Order.status == OrderStatus.STARTED,
            Order.customer_email == customer_email,
        )
    )
    existing_order = result.scalars().first()
    if existing_order:
        return OrderRead.from_orm(existing_order)

    # Fetch invitation
    result = await read_db.execute(
        select(Invitation).where(Invitation.id == payload.invitation_id)
    )
    invitation = result.scalars().first()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found")

    # Generate unique order number
    while True:
        order_number = "MP" + "".join(random.choices(string.digits, k=8))
        existing = await read_db.execute(
            select(Order).where(Order.order_number == order_number)
        )
        if not existing.scalars().first():
            break

    order = Order(
        order_number=order_number,
        invitation_id=invitation.id,
        invitation_title=invitation.title,
        invitation_wallpaper=invitation.wallpaper,
        total_price=0,
        status=OrderStatus.STARTED,
        customer_name=customer_name,
        customer_email=customer_email,
        currency="BGN",
    )

    write_db.add(order)
    await write_db.commit()
    await write_db.refresh(order)

    return OrderRead.from_orm(order)


# -------------------- LIST PRICE TIERS --------------------
@router.get("/price-tiers/{currency}", response_model=PriceTierReadWithChoices)
async def get_price_tiers(
    currency: str,
    read_db: AsyncSession = Depends(get_read_session),
):
    """
    Fetch all active price tiers filtered by the currency in the URL,
    and all available currencies. Sorted by price per duration day.
    """
    # Fetch tiers sorted by price per duration day
    query = (
        select(PriceTier)
        .where(PriceTier.active, PriceTier.currency == currency.upper())
        .order_by(PriceTier.price)
    )
    result = await read_db.execute(query)
    tiers = result.scalars().all()

    # Fetch distinct currencies
    currency_result = await read_db.execute(
        select(distinct(PriceTier.currency)).where(PriceTier.active)
    )
    currencies = currency_result.scalars().all()

    return PriceTierReadWithChoices(
        tiers=[PriceTierRead.from_orm(t) for t in tiers], currencies=currencies
    )


# -------------------- UPDATE ORDER PRICE + VOUCHER --------------------
@router.patch("/update/{order_id}", response_model=OrderRead)
async def update_order_price(
    order_id: int,
    payload: OrderUpdatePrice,
    current_user: dict = Depends(require_role("customer")),
    write_db: AsyncSession = Depends(get_write_session),
    read_db: AsyncSession = Depends(get_read_session),
):
    """
    Update order's price tier, currency, and voucher.
    Handles applying and removing vouchers explicitly.
    """

    # Fetch order from read_db
    result = await read_db.execute(
        select(Order)
        .options(
            selectinload(Order.price_tier),
            selectinload(Order.voucher),
            selectinload(Order.invitation),
        )
        .where(Order.id == order_id, Order.customer_email == current_user["email"])
    )
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found or forbidden")

    # Determine price tier
    result = await read_db.execute(
        select(PriceTier).where(
            PriceTier.active,
            PriceTier.duration_days == payload.duration_days,
            PriceTier.currency == payload.currency.upper(),
        )
    )
    price_tier = result.scalars().first()
    if not price_tier:
        raise HTTPException(status_code=400, detail="Invalid price tier")

    total_price = Decimal(price_tier.price)

    # --- Handle voucher ---
    discount_amount = Decimal(0)
    voucher_obj = None

    if payload.voucher_code:
        # Apply voucher
        result = await read_db.execute(
            select(Voucher).where(
                Voucher.code == payload.voucher_code,
                Voucher.active,
                Voucher.valid_from <= datetime.utcnow(),
                Voucher.valid_until >= datetime.utcnow(),
            )
        )
        voucher_obj = result.scalars().first()
        if not voucher_obj:
            raise HTTPException(status_code=400, detail="Invalid or expired voucher")

        if (
            voucher_obj.usage_limit
            and voucher_obj.used_count >= voucher_obj.usage_limit
        ):
            raise HTTPException(status_code=400, detail="Voucher usage limit exceeded")
        if voucher_obj.customer_id and voucher_obj.customer_id != order.customer_id:
            raise HTTPException(
                status_code=400, detail="Voucher not valid for this customer"
            )

        if voucher_obj.discount_type == "percent":
            discount_amount = (
                total_price * Decimal(voucher_obj.amount) / Decimal(100)
            ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        else:
            voucher_currency = voucher_obj.currency or "BGN"
            if voucher_currency != price_tier.currency:
                result = await read_db.execute(select(CurrencyRate))
                rates = {c.currency: c.rate_to_bgn for c in result.scalars().all()}

                try:
                    rate_from = Decimal(rates[voucher_currency])
                    rate_to = Decimal(rates[price_tier.currency])
                    discount_amount = (
                        Decimal(voucher_obj.amount) * rate_to / rate_from
                    ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                except KeyError:
                    raise HTTPException(
                        status_code=400, detail="Currency conversion rate not found"
                    )
            else:
                discount_amount = Decimal(voucher_obj.amount).quantize(
                    Decimal("0.01"), rounding=ROUND_HALF_UP
                )
    else:
        # Explicitly handle removal of voucher
        voucher_obj = None
        discount_amount = Decimal(0)

    # Calculate final price
    final_price = max(total_price - discount_amount, Decimal(0))

    # Merge order into write_db session
    order = await write_db.merge(order)

    # Update order
    order.total_price = final_price
    order.duration_days = price_tier.duration_days
    order.price_tier_id = price_tier.id
    order.voucher_id = voucher_obj.id if voucher_obj else None
    order.discount_amount = discount_amount
    order.original_price = total_price
    order.currency = price_tier.currency

    await write_db.commit()
    await write_db.refresh(order)

    return OrderRead.from_orm(order)


@router.post("/initiate-payment/{order_id}")
async def initiate_payment(
    order_id: int,
    current_user: dict = Depends(require_role("customer")),
    read_db: AsyncSession = Depends(get_read_session),
):
    # Fetch order
    result = await read_db.execute(
        select(Order)
        .options(selectinload(Order.invitation))
        .where(Order.id == order_id, Order.customer_email == current_user["email"])
    )
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found or forbidden")

    # Create Stripe session
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": "bgn",
                        "product_data": {
                            "name": f"Покана: {order.invitation.title}",
                            "images": [order.invitation_wallpaper],
                        },
                        "unit_amount": int(order.total_price * 100),
                    },
                    "quantity": 1,
                }
            ],
            mode="payment",
            success_url=f"{settings.FRONTEND_BASE_URL}/profile/orders/{order.order_number}?payment=success",
            cancel_url=f"{settings.FRONTEND_BASE_URL}/profile/orders/{order.order_number}?payment=cancel",
            metadata={"order_number": str(order.order_number)},
            locale="bg",
        )
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")

    return {"stripe_session_id": session.id, "payment_url": session.url}


# -------------------- INVOICE --------------------
@router.get("/{order_id}/invoice")
async def generate_invoice(
    order_id: int,
    current_user: dict = Depends(require_role("customer")),
    read_db: AsyncSession = Depends(get_read_session),
):
    result = await read_db.execute(
        select(Order)
        .options(
            selectinload(Order.price_tier),
            selectinload(Order.voucher),
            selectinload(Order.invitation),
        )
        .where(Order.id == order_id, Order.customer_email == current_user["email"])
    )
    order = result.scalars().first()
    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found or you do not have permission to view it",
        )

    if not order.paid:
        raise HTTPException(
            status_code=400, detail="Invoice available only for paid orders"
        )

    order_data = format_order_dates(order)

    template = env.get_template("invoice.html")
    html_string = template.render(
        order=order_data, logo_url=f"{settings.FRONTEND_BASE_URL}/logo.png"
    )

    pdf_file = BytesIO()
    HTML(string=html_string).write_pdf(pdf_file)
    pdf_file.seek(0)

    filename = f"invoice_{order.order_number}.pdf"
    return StreamingResponse(
        pdf_file,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
    )
