import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { username, password } = body;

  try {
    const response = await fetch(`${process.env.API_URL_SERVER}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json({ error: data.detail || "Registration failed" }, { status: response.status });
    }

    const tokens = await response.json();

    const res = NextResponse.json({ success: true });

    const isProd = process.env.NODE_ENV === "production";

    res.cookies.set("access_token", tokens.access_token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      expires: new Date(tokens.access_token_expires),
    });

    res.cookies.set("access_token_expires", tokens.access_token_expires, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
    });

    res.cookies.set("refresh_token", tokens.refresh_token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      expires: new Date(tokens.refresh_token_expires),
    });

    res.cookies.set("refresh_token_expires", tokens.refresh_token_expires, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
    });

    return res;
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
