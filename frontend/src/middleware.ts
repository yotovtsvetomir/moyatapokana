import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { setAuthCookies } from "@/utils/setAuthCookies";

const protectedRoutes = ["/profile"];
const authPages = ["/login", "/register"];

export async function middleware(req: NextRequest) {
  const accessToken = req.cookies.get("access_token")?.value;
  const refreshToken = req.cookies.get("refresh_token")?.value;
  const accessTokenExpires = req.cookies.get("access_token_expires")?.value;
  const refreshTokenExpires = req.cookies.get("refresh_token_expires")?.value;

  const pathname = req.nextUrl.pathname;
  const isAuthPage = authPages.includes(pathname);
  const isProtectedPage = protectedRoutes.some((route) => pathname.startsWith(route));

  if (accessToken && isAuthPage) {
    return NextResponse.redirect(new URL("/profile", req.url));
  }

  if (!accessToken && isProtectedPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (accessToken && refreshToken && accessTokenExpires && refreshTokenExpires) {
    try {
      const now = Date.now();

      const accessExpireTime = new Date(accessTokenExpires).getTime();
      const refreshExpireTime = new Date(refreshTokenExpires).getTime();

      // Optionally, refresh a bit before expiration (e.g., 1 min before)
      const refreshBufferMs = 60 * 1000;

      if (now + refreshBufferMs < accessExpireTime) {
        // Token still valid, continue
        return NextResponse.next();
      }

      if (now > refreshExpireTime) {
        // Refresh token expired - redirect to login and clear cookies
        const response = NextResponse.redirect(new URL("/login", req.url));
        response.cookies.delete("access_token");
        response.cookies.delete("refresh_token");
        response.cookies.delete("access_token_expires");
        response.cookies.delete("refresh_token_expires");
        return response;
      }

      // Access token expired or near expiry, refresh tokens
      const refreshRes = await fetch(`${process.env.API_URL_SERVER}/users/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (refreshRes.ok) {
        const newTokens = await refreshRes.json();
        const response = NextResponse.next();

        // Set all tokens and expires cookies using helper (adapt it to set expires cookies too)
        response.cookies.set("access_token", newTokens.access_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          expires: new Date(newTokens.access_token_expires),
        });
        response.cookies.set("access_token_expires", newTokens.access_token_expires, {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        });
        response.cookies.set("refresh_token", newTokens.refresh_token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          expires: new Date(newTokens.refresh_token_expires),
        });
        response.cookies.set("refresh_token_expires", newTokens.refresh_token_expires, {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        });

        return response;
      } else {
        // Refresh token failed - clear and redirect
        const response = NextResponse.redirect(new URL("/login", req.url));
        response.cookies.delete("access_token");
        response.cookies.delete("refresh_token");
        response.cookies.delete("access_token_expires");
        response.cookies.delete("refresh_token_expires");
        return response;
      }
    } catch (error) {
      console.error("Middleware refresh error:", error);
      const response = NextResponse.redirect(new URL("/login", req.url));
      response.cookies.delete("access_token");
      response.cookies.delete("refresh_token");
      response.cookies.delete("access_token_expires");
      response.cookies.delete("refresh_token_expires");
      return response;
    }
  }

  return NextResponse.next();
}
