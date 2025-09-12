from datetime import datetime
from sqlalchemy.dialects.postgresql import insert
from app.db.models.user import DailyUserStats
from sqlalchemy.ext.asyncio import AsyncSession

async def increment_daily_user_stat(unique_id: str, session: AsyncSession):
    today = datetime.utcnow().date()

    stmt = insert(DailyUserStats).values(
        date=today,
        unique_id=unique_id,
    ).on_conflict_do_nothing(
        index_elements=["date", "unique_id"]
    )

    await session.execute(stmt)
    await session.commit()

