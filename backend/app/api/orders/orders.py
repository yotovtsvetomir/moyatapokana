import os
import random
import string
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import get_write_session, get_read_session
from app.db.models.order import Order, OrderStatus, Voucher
from app.db.models.invitation import Invitation
from app.schemas.order import OrderCreate, OrderRead, OrderUpdatePrice
from app.services.price_tiers import get_duration_from_price
from app.core.permissions import require_role
from fastapi.responses import StreamingResponse
from io import BytesIO
from jinja2 import Environment, FileSystemLoader, select_autoescape
from weasyprint import HTML
from app.core.settings import settings

router = APIRouter()

TEMPLATE_DIR = os.path.join("app", "templates", "orders")
env = Environment(
    loader=FileSystemLoader(TEMPLATE_DIR),
    autoescape=select_autoescape(["html", "xml"]),
)


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
@router.post("/", response_model=OrderRead)
async def create_order_route(
    payload: OrderCreate,
    current_user: dict = Depends(require_role("customer")),
    write_db: AsyncSession = Depends(get_write_session),
    read_db: AsyncSession = Depends(get_read_session),
):
    # Use the logged-in user's email
    payload.customer_email = current_user["email"]
    payload.customer_name = current_user.get("first_name") or current_user["email"]

    # Check if an existing STARTED order exists for this invitation and customer
    result = await read_db.execute(
        select(Order).where(
            Order.invitation_id == payload.invitation_id,
            Order.status == OrderStatus.STARTED,
            Order.customer_email == payload.customer_email,
        )
    )
    existing_order = result.scalars().first()
    if existing_order:
        return OrderRead(**existing_order.__dict__)

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

    # Create order
    order = Order(
        order_number=order_number,
        invitation_id=invitation.id,
        invitation_title=invitation.title,
        total_price=0,
        duration_days=None,
        status=OrderStatus.STARTED,
        customer_name=payload.customer_name,
        customer_email=payload.customer_email,
    )

    write_db.add(order)
    await write_db.commit()
    await write_db.refresh(order)

    return OrderRead(**order.__dict__)


# -------------------- UPDATE ORDER PRICE + VOUCHER --------------------
@router.patch("/{order_id}/set-price", response_model=OrderRead)
async def update_order_price(
    order_id: int,
    payload: OrderUpdatePrice,
    current_user: dict = Depends(require_role("customer")),
    write_db: AsyncSession = Depends(get_write_session),
    read_db: AsyncSession = Depends(get_read_session),
):
    result = await write_db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.customer_email == current_user["email"],
        )
    )
    order = result.scalars().first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found or you do not have permission to edit it",
        )

    # Calculate duration based on price tier
    duration_days = get_duration_from_price(payload.total_price)

    # Apply voucher if provided
    discount_amount = 0
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

        # Check usage limit
        if (
            voucher_obj.usage_limit is not None
            and voucher_obj.used_count >= voucher_obj.usage_limit
        ):
            raise HTTPException(status_code=400, detail="Voucher usage limit exceeded")

        # Optional customer restriction
        if voucher_obj.customer_id and voucher_obj.customer_id != order.customer_id:
            raise HTTPException(
                status_code=400, detail="Voucher not valid for this customer"
            )

        # Calculate discount
        if voucher_obj.discount_type == "percent":
            discount_amount = (
                float(payload.total_price) * float(voucher_obj.amount) / 100
            )
        else:  # fixed
            discount_amount = float(voucher_obj.amount)

    final_price = float(payload.total_price) - discount_amount
    if final_price < 0:
        final_price = 0

    # Update order
    order.total_price = final_price
    order.duration_days = duration_days
    order.voucher_id = voucher_obj.id if voucher_obj else None
    order.discount_amount = discount_amount
    order.original_price = payload.total_price

    write_db.add(order)
    await write_db.commit()
    await write_db.refresh(order)

    return OrderRead(**order.__dict__)


@router.post("/{order_id}/checkout", response_model=OrderRead)
async def checkout_order(
    order_id: int,
    current_user: dict = Depends(require_role("customer")),  # Require login
    write_db: AsyncSession = Depends(get_write_session),
    read_db: AsyncSession = Depends(get_read_session),
):
    # Fetch the order for this user
    result = await read_db.execute(
        select(Order).where(
            Order.id == order_id, Order.customer_email == current_user["email"]
        )
    )
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Ensure price tier is set
    if (
        order.total_price is None
        or order.total_price <= 0
        or order.duration_days is None
    ):
        raise HTTPException(
            status_code=400,
            detail="Please select a price tier before proceeding to checkout",
        )

    # Validate voucher if applied
    if order.voucher_id:
        result = await read_db.execute(
            select(Voucher).where(
                Voucher.id == order.voucher_id,
                Voucher.active,
                Voucher.valid_from <= datetime.utcnow(),
                Voucher.valid_until >= datetime.utcnow(),
            )
        )
        voucher = result.scalars().first()
        if not voucher:
            raise HTTPException(status_code=400, detail="Invalid or expired voucher")

    # Mark order as READY_FOR_CHECKOUT (or whatever status you want)
    order.status = OrderStatus.READY_FOR_CHECKOUT
    write_db.add(order)
    await write_db.commit()
    await write_db.refresh(order)

    return OrderRead(**order.__dict__)


@router.get("/{order_id}/invoice")
async def generate_invoice(
    order_id: int,
    current_user: dict = Depends(require_role("customer")),
    read_db: AsyncSession = Depends(get_read_session),
):
    # Fetch order and ensure ownership
    result = await read_db.execute(
        select(Order).where(
            Order.id == order_id,
            Order.customer_email == current_user["email"],
        )
    )
    order = result.scalars().first()
    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found or you do not have permission to view it",
        )

    if not order.paid:
        raise HTTPException(
            status_code=400,
            detail="Invoice available only for paid orders",
        )

    # Prepare order data for template
    order_data = format_order_dates(order)

    # Render HTML
    template = env.get_template("invoice.html")
    html_string = template.render(
        order=order_data, logo_url=f"{settings.FRONTEND_BASE_URL}/logo.png"
    )

    # Generate PDF
    pdf_file = BytesIO()
    HTML(string=html_string).write_pdf(pdf_file)
    pdf_file.seek(0)

    filename = f"invoice_{order.order_number}.pdf"
    return StreamingResponse(
        pdf_file,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
    )
