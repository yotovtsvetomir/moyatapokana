import json
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Request, Depends
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func, select

from app.db.session import get_read_session
from app.db.models.user import User, UserActivity
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

    # Currently active users from Redis
    keys = await redis.keys("user_session:*")
    active_users = set()

    if keys:
        raw_sessions = await redis.mget(*keys)
        for raw in raw_sessions:
            if not raw:
                continue
            session_data = json.loads(raw)
            if session_data.get("role") != "customer":
                continue
            created_at = datetime.fromisoformat(
                session_data["created_at"].replace("Z", "+00:00")
            )
            user_id = session_data["user_id"]
            if now - created_at <= timedelta(minutes=ACTIVE_MINUTES):
                active_users.add(user_id)

    # Active today
    result_today = await db.execute(
        select(UserActivity.user_id).where(
            UserActivity.activity_type == "login",
            func.date(UserActivity.timestamp) == today,
        )
    )
    users_today = {row[0] for row in result_today.all()}

    # Active this month
    result_month = await db.execute(
        select(UserActivity.user_id).where(
            UserActivity.activity_type == "login",
            UserActivity.timestamp >= first_day_month,
        )
    )
    users_this_month = {row[0] for row in result_month.all()}

    # Total registered customers
    total_customers = await db.scalar(
        select(func.count()).select_from(User).filter(User.role == "customer")
    )

    return templates.TemplateResponse(
        "admin/analytics.html",
        {
            "request": request,
            "active_users": len(active_users),
            "users_today": len(users_today),
            "users_this_month": len(users_this_month),
            "total_customers": total_customers,
        },
    )
