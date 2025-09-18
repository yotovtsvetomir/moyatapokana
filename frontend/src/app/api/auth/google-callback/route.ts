import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
const redirectUri = process.env.NEXT_PUBLIC_CLIENT_URL + "/api/auth/google-callback";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  // Exchange code for tokens from Google
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const errorBody = await tokenRes.text();
    return NextResponse.json({ error: "Failed to get tokens", details: errorBody }, { status: 400 });
  }

  const tokenData = await tokenRes.json();
  const { id_token } = tokenData;

  if (!id_token) {
    return NextResponse.json({ error: "No id_token returned" }, { status: 400 });
  }

  const backendRes = await fetch(`${process.env.API_URL_SERVER}/users/google-login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": request.headers.get("cookie") || "",
    },
    body: JSON.stringify({ id_token }),
  });

  if (!backendRes.ok) {
    const error = await backendRes.json();
    return NextResponse.json({ error: "Backend login failed", details: error }, { status: 400 });
  }

  const backendData = await backendRes.json();

  const res = NextResponse.redirect(new URL("/%D1%81%D0%BE%D1%86%D0%B8%D0%B0%D0%BB%D0%BD%D0%BE-%D0%BF%D1%80%D0%B5%D0%BD%D0%B0%D1%81%D0%BE%D1%87%D0%B2%D0%B0%D0%BD%D0%B5", request.url));

  const isProd = process.env.NODE_ENV === "production";

  const SESSION_EXPIRE_SECONDS = parseInt(process.env.SESSION_EXPIRE_SECONDS || "604800", 10);
  const expires = new Date(Date.now() + SESSION_EXPIRE_SECONDS * 1000);

  // Set real session cookie
  res.cookies.set("session_id", backendData.session_id, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    expires,
  });

  // Delete anonymous session cookie if it exists
  res.cookies.delete("anonymous_session_id");

  return res;
}
