import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const response = await fetch(`${process.env.API_URL_SERVER}/users/refresh-session`, {
      method: "POST",
      headers: { cookie: req.headers.get("cookie") || "" },
    });

    if (!response.ok) {
      return NextResponse.json({ success: false }, { status: 401 });
    }

    const data = await response.json();

    const res = NextResponse.json({ success: true });

    const isProd = process.env.NODE_ENV === "production";

    res.cookies.set("session_id", data.session_id, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      expires: new Date(data.expires_at),
    });

    return res;
  } catch (err) {
    console.error("Refresh session error:", err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
