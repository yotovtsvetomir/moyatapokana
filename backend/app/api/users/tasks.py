from datetime import datetime
from sqlalchemy import delete
from app.db.session import get_write_session
from app.db.models.user import AccessToken, RefreshToken
from app.celery_app import celery_app
import asyncio


@celery_app.task(name="app.api.users.tasks.cleanup_expired_tokens")
def cleanup_expired_tokens():
    async def _cleanup():
        async for session in get_write_session():
            now = datetime.utcnow()

            await session.execute(
                delete(AccessToken).where(AccessToken.expires_at < now)
            )
            await session.execute(
                delete(RefreshToken).where(RefreshToken.expires_at < now)
            )

            await session.commit()

    asyncio.run(_cleanup())
