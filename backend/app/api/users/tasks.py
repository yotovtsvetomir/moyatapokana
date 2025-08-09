import redis
from app.celery_app import celery_app
from datetime import datetime
from sqlalchemy import delete
from app.db.models.user import AccessToken, RefreshToken
from app.db.session import get_write_session
from contextlib import asynccontextmanager

redis_client = redis.Redis(host="redis", port=6379, db=0)


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
    lock_key = "lock:cleanup_expired_tokens"

    # Atomically set the lock key with value "locked" only if the key does NOT already exist.
    # This ensures only one task can acquire the lock at a time.
    # If the key exists, set() returns False, so we skip running this task.
    have_lock = redis_client.set(lock_key, "locked", nx=True)
    if not have_lock:
        print("Lock exists, skipping the task.")
        return

    try:
        loop = celery_app.asyncio_loop
        loop.run_until_complete(cleanup_expired_tokens_async())
    finally:
        redis_client.delete(lock_key)
