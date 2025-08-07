import Redis from "ioredis";
import type { components } from "@/share/types";

const redis = new Redis(process.env.REDIS_URL || "redis://redis:6379");

export async function getCachedUser(token: string) {
  const data = await redis.get(`user:${token}`);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function setCachedUser(token: string, user: components["schemas"]["UserRead"], ttlSeconds = 1800) {
  await redis.set(`user:${token}`, JSON.stringify(user), "EX", ttlSeconds);
}

export default redis;
