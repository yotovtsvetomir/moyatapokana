import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

const clientId = process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID!;
const clientSecret = process.env.FACEBOOK_CLIENT_SECRET!;
const redirectUri = process.env.NEXT_PUBLIC_CLIENT_URL + "/api/auth/facebook-callback";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  // Exchange code for access token
  const tokenRes = await fetch(
    `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${clientId}&redirect_uri=${redirectUri}&client_secret=${clientSecret}&code=${code}`,
    { method: "GET" }
  );

  if (!tokenRes.ok) {
    const errorBody = await tokenRes.text();
    return NextResponse.json({ error: "Failed to get access token", details: errorBody }, { status: 400 });
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  if (!accessToken) {
    return NextResponse.json({ error: "No access token returned" }, { status: 400 });
  }

  // Fetch user info from Facebook
  const userRes = await fetch(
    `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`,
    { method: "GET" }
  );

  if (!userRes.ok) {
    const errorBody = await userRes.text();
    return NextResponse.json({ error: "Failed to get user info", details: errorBody }, { status: 400 });
  }

  const userData = await userRes.json();

  // Send user data to backend for login/registration
  const backendRes = await fetch(`${process.env.API_URL_SERVER}/users/facebook-login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": request.headers.get("cookie") || "",
    },
    body: JSON.stringify({ user: userData }),
  });

  if (!backendRes.ok) {
    const error = await backendRes.json();
    return NextResponse.json({ error: "Backend login failed", details: error }, { status: 400 });
  }

  const backendData = await backendRes.json();

  const res = NextResponse.redirect(new URL("/social-redirect", request.url));

  const isProd = process.env.NODE_ENV === "production";
  const SESSION_EXPIRE_SECONDS = parseInt(process.env.SESSION_EXPIRE_SECONDS || "604800", 10);
  const expires = new Date(Date.now() + SESSION_EXPIRE_SECONDS * 1000);

  // Set real session cookie
  res.cookies.set("session_id", backendData.session_id, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    expires,
  });

  // Delete anonymous session cookie if it exists
  res.cookies.delete("anonymous_session_id");

  return res;
}
