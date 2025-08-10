import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/profile"];
const authPages = ["/login", "/register"];

export async function middleware(req: NextRequest) {
  const sessionId = req.cookies.get("session_id")?.value;
  const pathname = req.nextUrl.pathname;

  const isAuthPage = authPages.includes(pathname);
  const isProtectedPage = protectedRoutes.some(route => pathname.startsWith(route));

  if (sessionId && isAuthPage) {
    return NextResponse.redirect(new URL("/profile", req.url));
  }

  if (!sessionId && isProtectedPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}
