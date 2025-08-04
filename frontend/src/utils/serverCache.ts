import type { components } from "@/share/types";

type User = components["schemas"]["UserRead"];

type CacheEntry = {
  user: User;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry>();

export function getCachedUser(token: string): User | null {
  const entry = cache.get(token);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    cache.delete(token);
    return null;
  }

  return entry.user;
}

export function setCachedUser(token: string, user: User): void {
  const expiresAt = Date.now() + 30 * 60 * 1000; // 30 minutes
  cache.set(token, { user, expiresAt });
}
