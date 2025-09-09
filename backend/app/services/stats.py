from datetime import datetime
from sqlalchemy.dialects.postgresql import insert
from app.db.models.user import DailyUserStats
from sqlalchemy.ext.asyncio import AsyncSession

async def increment_daily_user_stat(user_type: str, session: AsyncSession):
    today = datetime.utcnow().date()
    stmt = insert(DailyUserStats).values(
        date=today,
        user_type=user_type,
        active_count=1,
    )
    stmt = stmt.on_conflict_do_update(
        index_elements=["date", "user_type"],
        set_={
            "active_count": DailyUserStats.active_count + 1,
            "updated_at": datetime.utcnow(),
        },
    )
    await session.execute(stmt)
    await session.commit()
