import redis
from app.celery_app import celery_app
from datetime import datetime
from app.db.celery_session import get_write_session
from contextlib import asynccontextmanager
from sqlalchemy import text

redis_client = redis.Redis(host="redis", port=6379, db=0)


@asynccontextmanager
async def get_session():
    gen = get_write_session()
    session = await gen.__anext__()
    try:
        yield session
    finally:
        await gen.aclose()


async def dummy_db_task_async():
    now = datetime.utcnow()
    async with get_session() as session:
        await session.execute(text("SELECT 1"))
        print(f"Dummy task ran at {now.isoformat()}")


@celery_app.task(name="app.tasks.dummy_db_task")
def dummy_db_task():
    lock_key = "lock:dummy_db_task"
    have_lock = redis_client.set(lock_key, "locked", nx=True, ex=60)
    if not have_lock:
        print("Lock exists, skipping the task.")
        return

    try:
        loop = celery_app.asyncio_loop
        loop.run_until_complete(dummy_db_task_async())
    finally:
        redis_client.delete(lock_key)
