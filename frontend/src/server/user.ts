import { getAccessToken } from "@/utils/auth";
import { getCachedUser, setCachedUser } from "@/utils/serverCache";
import type { components } from "@/share/types";

type User = components["schemas"]["UserRead"];

export async function fetchUserSSR(): Promise<User | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const cached = getCachedUser(token);
  if (cached) return cached;

  try {
    const res = await fetch(`${process.env.API_URL_SERVER}/users/me`, {
      headers: {
        cookie: `access_token=${token}`,
      },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const user = (await res.json()) as User;
    setCachedUser(token, user);
    return user;
  } catch (err) {
    console.error("fetchUserSSR error:", err);
    return null;
  }
}
