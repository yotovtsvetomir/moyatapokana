from datetime import datetime
from sqlalchemy import delete
from app.db.models.user import AccessToken, RefreshToken
from app.db.session import get_write_session
from contextlib import asynccontextmanager
from app.celery_app import celery_app  # Import the celery_app instance


@asynccontextmanager
async def get_session():
    gen = get_write_session()
    session = await gen.__anext__()
    try:
        yield session
    finally:
        await gen.aclose()


async def cleanup_expired_tokens_async():
    now = datetime.utcnow()
    async with get_session() as session:
        await session.execute(delete(AccessToken).where(AccessToken.expires_at < now))
        await session.execute(delete(RefreshToken).where(RefreshToken.expires_at < now))
        await session.commit()


@celery_app.task(name="app.api.users.tasks.cleanup_expired_tokens")
def cleanup_expired_tokens():
    loop = celery_app.asyncio_loop
    loop.run_until_complete(cleanup_expired_tokens_async())
