import { getCachedUser } from "@/utils/redisClient";
import type { components } from '@/shared/types';

type User = components["schemas"]["UserRead"];

export async function fetchUserSSR(sessionId: string | null): Promise<User | null> {
  if (!sessionId) return null;
  const cached = await getCachedUser(sessionId);
  return cached;
}
