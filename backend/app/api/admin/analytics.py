import json
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Request, Depends
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import aliased

from app.db.session import get_read_session
from app.db.models.user import User, DailyUserStats
from app.db.models.order import Order, CurrencyRate, PriceTier
from app.core.redis_client import get_redis_client

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

ACTIVE_MINUTES = 15


async def get_top_tiers(db: AsyncSession, start_date=None, end_date=None):
    rate_alias = aliased(CurrencyRate)
    query = (
        select(
            PriceTier.id,
            PriceTier.price,
            PriceTier.duration_days,
            PriceTier.currency,
            func.count(Order.id).label("orders_count"),
            (PriceTier.price / rate_alias.rate_to_bgn).label("price_bgn"),
        )
        .join(Order, Order.price_tier_id == PriceTier.id)
        .join(rate_alias, rate_alias.currency == PriceTier.currency)
        .where(Order.paid)
    )
    if start_date:
        query = query.where(Order.created_at >= start_date)
    if end_date:
        query = query.where(Order.created_at <= end_date)
    query = query.group_by(
        PriceTier.id, PriceTier.price, PriceTier.duration_days, PriceTier.currency, rate_alias.rate_to_bgn
    ).order_by(desc(func.count(Order.id))).limit(3)

    result = await db.execute(query)
    return result.mappings().all()


@router.get("/analytics", response_class=HTMLResponse)
async def admin_analytics(
    request: Request, db: AsyncSession = Depends(get_read_session)
):
    redis = await get_redis_client()
    now = datetime.now(timezone.utc)
    today = now.date()
    first_day_month = today.replace(day=1)
    first_day_year = today.replace(month=1, day=1)

    # --- Previous month calculation ---
    first_day_last_month = (first_day_month - timedelta(days=1)).replace(day=1)
    last_day_last_month = first_day_month - timedelta(days=1)

    # --- Currently active sessions (last 15 minutes) ---
    keys = await redis.keys("user_session:*") + await redis.keys("anonymous_session:*")
    active_recent = set()

    if keys:
        raw_sessions = await redis.mget(*keys)
        for raw in raw_sessions:
            if not raw:
                continue
            session_data = json.loads(raw)
            created_at_str = session_data.get("created_at")
            if not created_at_str:
                continue
            created_at = datetime.fromisoformat(created_at_str.replace("Z", "+00:00"))
            if now - created_at <= timedelta(minutes=ACTIVE_MINUTES):
                session_id = (
                    session_data.get("user_id")
                    or session_data.get("anonymous_id")
                    or "anon"
                )
                active_recent.add(session_id)

    # --- Daily aggregates from DailyUserStats ---
    daily_stats_result = await db.execute(
        select(func.sum(DailyUserStats.active_count)).where(
            DailyUserStats.date == today
        )
    )
    daily_total_db = daily_stats_result.scalar() or 0

    # --- Monthly aggregates from DailyUserStats ---
    monthly_stats_result = await db.execute(
        select(func.sum(DailyUserStats.active_count)).where(
            DailyUserStats.date >= first_day_month
        )
    )
    monthly_total_db = monthly_stats_result.scalar() or 0

    # Combine Redis + DB for today
    active_users_today = daily_total_db + len(active_recent)
    active_users_this_month = monthly_total_db + len(active_recent)

    # --- Total registered customers ---
    total_customers = await db.scalar(
        select(func.count()).select_from(User).filter(User.role == "customer")
    )

    # --- Orders statistics (normalized to BGN) ---
    rate_alias = aliased(CurrencyRate)
    base_query = (
        select(
            func.count(Order.id).label("orders_count"),
            func.sum(Order.paid_price / rate_alias.rate_to_bgn).label("total_revenue_bgn"),
            func.avg(Order.paid_price / rate_alias.rate_to_bgn).label("avg_order_bgn"),
        )
        .join(rate_alias, rate_alias.currency == Order.currency)
        .where(Order.paid)
    )

    # Daily
    daily_query = base_query.where(func.date(Order.created_at) == today)
    daily_result = await db.execute(daily_query)
    daily = daily_result.mappings().first() or {}

    # Monthly
    monthly_query = base_query.where(Order.created_at >= first_day_month)
    monthly_result = await db.execute(monthly_query)
    monthly = monthly_result.mappings().first() or {}

    # Last month
    last_month_query = base_query.where(
        Order.created_at >= first_day_last_month,
        Order.created_at <= last_day_last_month
    )
    last_month_result = await db.execute(last_month_query)
    last_month = last_month_result.mappings().first() or {}

    # Yearly
    yearly_query = base_query.where(Order.created_at >= first_day_year)
    yearly_result = await db.execute(yearly_query)
    yearly = yearly_result.mappings().first() or {}

    # Top 3 tiers
    top_tiers_daily = await get_top_tiers(db, start_date=today)
    top_tiers_month = await get_top_tiers(db, start_date=first_day_month)
    top_tiers_last_month = await get_top_tiers(db, start_date=first_day_last_month, end_date=last_day_last_month)
    top_tiers_year = await get_top_tiers(db, start_date=first_day_year)

    return templates.TemplateResponse(
        "admin/analytics.html",
        {
            "request": request,
            "active_users_recent": len(active_recent),
            "active_users_today": active_users_today,
            "active_users_this_month": active_users_this_month,
            "total_customers": total_customers,
            # Orders - daily
            "orders_count_today": daily.get("orders_count", 0) or 0,
            "total_revenue_today_bgn": float(daily.get("total_revenue_bgn") or 0),
            "avg_order_today_bgn": float(daily.get("avg_order_bgn") or 0),
            "top_tiers_daily": top_tiers_daily,
            # Orders - monthly
            "orders_count_month": monthly.get("orders_count", 0) or 0,
            "total_revenue_month_bgn": float(monthly.get("total_revenue_bgn") or 0),
            "avg_order_month_bgn": float(monthly.get("avg_order_bgn") or 0),
            "top_tiers_month": top_tiers_month,
            # Orders - last month
            "orders_count_last_month": last_month.get("orders_count", 0) or 0,
            "total_revenue_last_month_bgn": float(last_month.get("total_revenue_bgn") or 0),
            "avg_order_last_month_bgn": float(last_month.get("avg_order_bgn") or 0),
            "top_tiers_last_month": top_tiers_last_month,
            # Orders - yearly
            "orders_count_year": yearly.get("orders_count", 0) or 0,
            "total_revenue_year_bgn": float(yearly.get("total_revenue_bgn") or 0),
            "avg_order_year_bgn": float(yearly.get("avg_order_bgn") or 0),
            "top_tiers_year": top_tiers_year,
        },
    )
