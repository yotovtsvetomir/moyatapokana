import os
import random
import string
import stripe
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request
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
from app.services.pagination import paginate
from app.schemas.order import (
    OrderCreate,
    OrderRead,
    OrderUpdatePrice,
    PriceTierRead,
    OrderWithTiersResponse,
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
@router.post("/create", response_model=OrderWithTiersResponse)
async def create_order_with_tiers_route(
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
        .options(
            selectinload(Order.price_tier),
            selectinload(Order.voucher),
            selectinload(Order.invitation),
        )
        .where(
            Order.invitation_id == payload.invitation_id,
            Order.status == OrderStatus.STARTED,
            Order.customer_email == customer_email,
        )
    )
    existing_order = result.scalars().first()
    if existing_order:
        order = existing_order
    else:
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

        # Create new order
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

    # Fetch active tiers and available currencies (same as update-with-tiers)
    tier_result = await read_db.execute(
        select(PriceTier)
        .where(PriceTier.active, PriceTier.currency == order.currency)
        .order_by(PriceTier.price)
    )
    tiers = tier_result.scalars().all()

    currency_result = await read_db.execute(
        select(distinct(PriceTier.currency)).where(PriceTier.active)
    )
    currencies = currency_result.scalars().all()

    return OrderWithTiersResponse(
        order=OrderRead.from_orm(order),
        tiers=[PriceTierRead.from_orm(t) for t in tiers],
        currencies=currencies,
    )


# -------------------- UPDATE ORDER PRICE + FETCH TIERS --------------------
@router.patch("/update/{order_id}", response_model=OrderWithTiersResponse)
async def update_order_with_tiers(
    order_id: int,
    payload: OrderUpdatePrice,
    current_user: dict = Depends(require_role("customer")),
    write_db: AsyncSession = Depends(get_write_session),
    read_db: AsyncSession = Depends(get_read_session),
):
    """
    Update order's price tier, currency, and voucher.
    If no tier selected, reset order price info and return immediately.
    """
    # Fetch order
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

    order = await write_db.merge(order)

    # If no tier is selected, reset order and return
    if payload.duration_days is None:
        order.price_tier_id = None
        order.duration_days = None
        order.original_price = Decimal(0)
        order.total_price = Decimal(0)
        order.discount_amount = Decimal(0)
        order.voucher_id = None
        order.currency = (
            payload.currency.upper() if payload.currency else order.currency
        )

        await write_db.commit()
        await write_db.refresh(order)

        # Fetch tiers & currencies for response
        tier_result = await read_db.execute(
            select(PriceTier)
            .where(PriceTier.active, PriceTier.currency == order.currency)
            .order_by(PriceTier.price)
        )
        tiers = tier_result.scalars().all()

        currency_result = await read_db.execute(
            select(distinct(PriceTier.currency)).where(PriceTier.active)
        )
        currencies = currency_result.scalars().all()

        return OrderWithTiersResponse(
            order=OrderRead.from_orm(order),
            tiers=[PriceTierRead.from_orm(t) for t in tiers],
            currencies=currencies,
        )

    # --- Tier is selected ---
    result = await read_db.execute(
        select(PriceTier).where(
            PriceTier.active,
            PriceTier.duration_days == payload.duration_days,
            PriceTier.currency
            == (payload.currency.upper() if payload.currency else order.currency),
        )
    )
    price_tier = result.scalars().first()
    if not price_tier:
        raise HTTPException(status_code=400, detail="Invalid price tier")

    total_price = Decimal(price_tier.price)
    order.price_tier_id = price_tier.id
    order.duration_days = price_tier.duration_days
    order.original_price = total_price
    order.currency = price_tier.currency

    # --- Apply voucher if provided ---
    discount_amount = Decimal(0)
    voucher_obj = None
    if payload.voucher_code:
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

        # Validate usage
        if (
            voucher_obj.usage_limit
            and voucher_obj.used_count >= voucher_obj.usage_limit
        ):
            raise HTTPException(status_code=400, detail="Voucher usage limit exceeded")
        if voucher_obj.customer_id and voucher_obj.customer_id != order.customer_id:
            raise HTTPException(
                status_code=400, detail="Voucher not valid for this customer"
            )

        # Calculate discount with currency conversion if needed
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

    # --- Apply totals ---
    order.total_price = max(total_price - discount_amount, Decimal(0))
    order.discount_amount = discount_amount if discount_amount > 0 else None
    order.voucher_id = voucher_obj.id if voucher_obj else None

    await write_db.commit()
    await write_db.refresh(order)

    # Fetch tiers & currencies
    tier_result = await read_db.execute(
        select(PriceTier)
        .where(PriceTier.active, PriceTier.currency == order.currency)
        .order_by(PriceTier.price)
    )
    tiers = tier_result.scalars().all()

    currency_result = await read_db.execute(
        select(distinct(PriceTier.currency)).where(PriceTier.active)
    )
    currencies = currency_result.scalars().all()

    return OrderWithTiersResponse(
        order=OrderRead.from_orm(order),
        tiers=[PriceTierRead.from_orm(t) for t in tiers],
        currencies=currencies,
    )


@router.post("/initiate-payment/{order_id}")
async def initiate_payment(
    order_id: int,
    current_user: dict = Depends(require_role("customer")),
    read_db: AsyncSession = Depends(get_read_session),
    write_db: AsyncSession = Depends(get_write_session),
):
    # Fetch order using read_db
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

    # Handle free orders with voucher
    if order.total_price == 0 and order.voucher_code:
        order.status = OrderStatus.PAID
        order.paid = True
        order.paid_price = 0
        order.paid_at = datetime.utcnow()

        if order.invitation:
            order.invitation.is_active = True
            order.invitation.active_from = datetime.utcnow()

        write_db.add(order)
        await write_db.commit()
        return {
            "stripe_session_id": None,
            "payment_url": None,
            "message": "Order fully paid. Invitation activated.",
        }

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[
                {
                    "price_data": {
                        "currency": order.currency.lower(),
                        "product_data": {
                            "name": f"Покана: {order.invitation.title}",
                            "images": [order.invitation_wallpaper]
                            if order.invitation_wallpaper
                            else [],
                        },
                        "unit_amount": int(order.total_price * 100),
                    },
                    "quantity": 1,
                }
            ],
            mode="payment",
            success_url=f"{settings.FRONTEND_BASE_URL}/profile/orders/{order.order_number}?payment_status=success",
            cancel_url=f"{settings.FRONTEND_BASE_URL}/profile/orders/{order.order_number}?payment_status=cancel",
            metadata={"order_number": str(order.order_number)},
            locale="bg",
            customer_email=current_user["email"],
        )
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=f"Stripe error: {str(e)}")

    return {"stripe_session_id": session.id, "payment_url": session.url}


@router.post("/payments/webhook/")
async def stripe_webhook(
    request: Request,
    write_db: AsyncSession = Depends(get_write_session),
):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    webhook_secret = settings.STRIPE_WEBHOOK_SECRET

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid payload")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        order_number = session["metadata"].get("order_number")

        result = await write_db.execute(
            select(Order).where(Order.order_number == order_number)
        )
        order = result.scalars().first()
        if not order or order.paid:
            return {"status": "ignored"}

        # Mark order as paid
        order.status = OrderStatus.PAID
        order.paid = True
        order.paid_price = order.total_price
        order.paid_at = datetime.utcnow()
        order.stripe_payment_intent = session.get("payment_intent")
        order.stripe_session_id = session.get("id")

        # Fetch invitation separately and attach it to session
        if order.invitation_id:
            result = await write_db.execute(
                select(Invitation).where(Invitation.id == order.invitation_id)
            )
            invitation = result.scalars().first()
            if invitation:
                now = datetime.utcnow()
                invitation.is_active = True
                invitation.active_from = now
                invitation.active_until = now + timedelta(days=order.duration_days or 0)
                write_db.add(invitation)  # Ensure it’s tracked

        # Commit all changes
        await write_db.commit()

    return {"status": "success"}


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


# -------------------- LIST USER ORDERS --------------------
@router.get("/", response_model=dict)
async def list_user_orders(
    page: int = 1,
    page_size: int = 10,
    status: OrderStatus | None = None,
    current_user: dict = Depends(require_role("customer")),
    read_db: AsyncSession = Depends(get_read_session),
):
    """
    Paginated list of orders for the current user.
    Optionally filter by status.
    """
    extra_filters = []
    if status:
        extra_filters.append(Order.status == status)

    result = await paginate(
        model=Order,
        db=read_db,
        page=page,
        page_size=page_size,
        owner_field="customer_email",
        owner_id=current_user["email"],
        options=[
            selectinload(Order.price_tier),
            selectinload(Order.voucher),
            selectinload(Order.invitation),
        ],
        schema=OrderRead,
        extra_filters=extra_filters,
        ordering=[Order.created_at.desc()],
    )

    return result


# -------------------- SINGLE USER ORDER --------------------
@router.get("/{order_number}", response_model=OrderRead)
async def get_user_order(
    order_number: str,
    current_user: dict = Depends(require_role("customer")),
    read_db: AsyncSession = Depends(get_read_session),
):
    """Return a single order for the current user."""
    result = await read_db.execute(
        select(Order)
        .options(
            selectinload(Order.price_tier),
            selectinload(Order.voucher),
            selectinload(Order.invitation),
        )
        .where(
            Order.order_number == order_number,
            Order.customer_email == current_user["email"],
        )
    )
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found or forbidden")
    return OrderRead.from_orm(order)
