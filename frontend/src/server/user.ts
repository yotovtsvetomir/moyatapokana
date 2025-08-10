import { getCachedUser } from "@/utils/redisClient";

export async function fetchUserSSR(sessionId: string | null): Promise<User | null> {
  if (!sessionId) return null;

  const cached = await getCachedUser(sessionId);
  return cached;
}
