import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/profile"];
const authPages = ["/login", "/register", "/password-reset/request"];

export async function middleware(req: NextRequest) {
  const sessionId = req.cookies.get("session_id")?.value;
  const anonymousSessionId = req.cookies.get("anonymous_session_id")?.value;
  const pathname = req.nextUrl.pathname;

  const isApiRoute = pathname.startsWith("/api/"); // skip for API requests
  const isAuthPage = authPages.includes(pathname);
  const isProtectedPage = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Skip session creation for API routes to prevent infinite loop
  if (isApiRoute) {
    return NextResponse.next();
  }

  // If logged in, block access to login/register pages
  if (sessionId && isAuthPage) {
    return NextResponse.redirect(new URL("/profile", req.url));
  }

  // If not logged in and accessing a protected route → redirect
  if (!sessionId && isProtectedPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Ensure anonymous session exists
  if (!sessionId && !anonymousSessionId) {
    const res = await fetch(`${req.nextUrl.origin}/api/auth/anonymous`, {
      method: "POST",
    });

    if (res.ok) {
      const data = await res.json();
      const response = NextResponse.next();

      response.cookies.set("anonymous_session_id", data.anonymous_session_id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: new Date(data.expires_at),
      });

      return response;
    } else {
      console.error("Failed to create anonymous session");
    }
  }

  return NextResponse.next();
}
