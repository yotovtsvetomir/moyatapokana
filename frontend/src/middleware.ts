import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/профил"];
const authPages = ["/влез", "/регистрация", "/ресет-на-парола/запитване"];

export async function middleware(req: NextRequest) {
  const sessionId = req.cookies.get("session_id")?.value;
  const uniqueId = req.cookies.get("unique_id")?.value;
  const anonymousSessionId = req.cookies.get("anonymous_session_id")?.value;
  const pathname = req.nextUrl.pathname;

  const isApiRoute = pathname.startsWith("/api/");
  const isAuthPage = authPages.includes(pathname);
  const isProtectedPage = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const ignoredPaths = ["/_next/", "/favicon.ico", "/manifest.json"];
  if (ignoredPaths.some(path => req.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Skip API routes
  if (isApiRoute) {
    return NextResponse.next();
  }

  // Logged in → block auth pages
  if (sessionId && isAuthPage) {
    return NextResponse.redirect(new URL("/профил", req.url));
  }

  // Not logged in → block protected pages
  if (!sessionId && isProtectedPage) {
    return NextResponse.redirect(new URL("/влез", req.url));
  }

  // Ensure `unique_id` exists
  if (!sessionId && !anonymousSessionId) {
    const cookieHeader = req.headers.get("cookie") ?? "";
    const res = await fetch(`${req.nextUrl.origin}/api/auth/anonymous`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": cookieHeader,
      },
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

      if (!uniqueId) {
        const oneYear = 365 * 24 * 60 * 60 * 1000;
        response.cookies.set("unique_id", data.unique_id, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          expires: new Date(Date.now() + oneYear),
        });
      }

      return response;
    } else {
      console.error("Failed to create anonymous session");
    }
  }

  return NextResponse.next();
}
