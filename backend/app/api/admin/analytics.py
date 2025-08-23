import json
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Request, Depends
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.session import get_read_session
from app.db.models.user import User, DailyUserStats
from app.core.redis_client import get_redis_client

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

ACTIVE_MINUTES = 15


@router.get("/analytics", response_class=HTMLResponse)
async def admin_analytics(
    request: Request, db: AsyncSession = Depends(get_read_session)
):
    redis = await get_redis_client()
    now = datetime.now(timezone.utc)
    today = now.date()
    first_day_month = today.replace(day=1)

    # --- Currently active sessions (last 15 minutes) ---
    keys = await redis.keys("user_session:*") + await redis.keys("anonymous_session:*")
    active_recent = set()  # all users/anonymous active in last 15 min

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

    return templates.TemplateResponse(
        "admin/analytics.html",
        {
            "request": request,
            "active_users_recent": len(active_recent),
            "active_users_today": active_users_today,
            "active_users_this_month": active_users_this_month,
            "total_customers": total_customers,
        },
    )
