import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL || "redis://redis:6379");

export async function getCachedUser(sessionId: string) {
  const data = await redis.get(`user_session:${sessionId}`);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export default redis;
