import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/profile"];
const authPages = ["/login", "/register", "/password-reset/request"];

export async function middleware(req: NextRequest) {
  const sessionId = req.cookies.get("session_id")?.value;
  const uniqueId = req.cookies.get("unique_id")?.value;
  const pathname = req.nextUrl.pathname;

  const isApiRoute = pathname.startsWith("/api/");
  const isAuthPage = authPages.includes(pathname);
  const isProtectedPage = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Skip API routes
  if (isApiRoute) {
    return NextResponse.next();
  }

  // Logged in → block auth pages
  if (sessionId && isAuthPage) {
    return NextResponse.redirect(new URL("/profile", req.url));
  }

  // Not logged in → block protected pages
  if (!sessionId && isProtectedPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Ensure `unique_id` exists
  if (!uniqueId) {
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

      response.cookies.set("unique_id", data.unique_id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: new Date(data.expires_at),
      });

      return response;
    } else {
      console.error("Failed to create unique session");
    }
  }

  return NextResponse.next();
}
