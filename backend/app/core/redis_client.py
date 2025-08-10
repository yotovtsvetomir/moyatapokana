import os
import redis.asyncio as redis

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379")

redis_client: redis.Redis | None = None


async def get_redis_client() -> redis.Redis:
    global redis_client
    if not redis_client:
        redis_client = await redis.from_url(
            REDIS_URL, encoding="utf-8", decode_responses=True
        )
    return redis_client
