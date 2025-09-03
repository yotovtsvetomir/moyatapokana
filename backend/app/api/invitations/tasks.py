import redis
from datetime import datetime
from sqlalchemy import update
from sqlalchemy.ext.asyncio import AsyncSession
from contextlib import asynccontextmanager

from app.celery_app import celery_app
from app.db.celery_session import get_write_session
from app.db.models.invitation import Invitation, InvitationStatus


# -------------------- Redis Lock --------------------
redis_client = redis.Redis(host="redis", port=6379, db=0)


# -------------------- Async Session Context --------------------
@asynccontextmanager
async def get_session() -> AsyncSession:
    """Provide a write async session from Celery tasks."""
    gen = get_write_session()
    session = await gen.__anext__()
    try:
        yield session
    finally:
        await gen.aclose()


# -------------------- Async Task Logic --------------------
async def deactivate_expired_invitations_async():
    """Deactivate all invitations whose active_until has passed."""
    now = datetime.utcnow()
    async with get_session() as session:
        stmt = (
            update(Invitation)
            .where(
                Invitation.active_until <= now,
                Invitation.is_active,
                Invitation.status == InvitationStatus.ACTIVE,
            )
            .values(
                status=InvitationStatus.EXPIRED,
                is_active=False,
                updated_at=now,
            )
            .execution_options(synchronize_session="fetch")
        )
        result = await session.execute(stmt)
        await session.commit()
        print(f"Deactivated {result.rowcount} expired invitations at {now.isoformat()}")


# -------------------- Celery Task Entry --------------------
@celery_app.task(name="invitations.tasks.deactivate_expired_invitations")
def deactivate_expired_invitations():
    """Celery task wrapper with Redis lock to prevent concurrent execution."""
    lock_key = "lock:deactivate_expired_invitations"
    have_lock = redis_client.set(lock_key, "locked", nx=True, ex=60 * 60)
    if not have_lock:
        print("Lock exists, skipping the task.")
        return

    try:
        loop = celery_app.asyncio_loop
        loop.run_until_complete(deactivate_expired_invitations_async())
    finally:
        redis_client.delete(lock_key)
