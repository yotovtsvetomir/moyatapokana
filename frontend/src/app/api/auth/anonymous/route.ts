import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = await fetch(`${process.env.API_URL_SERVER}/users/anonymous-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || "Anonymous session creation failed" },
        { status: response.status }
      );
    }

    const res = NextResponse.json(data);

    const isProd = process.env.NODE_ENV === "production";

    res.cookies.set("anonymous_session_id", data.anonymous_session_id, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      expires: new Date(data.expires_at),
    });

    return res;
  } catch (err) {
    console.error("Anonymous session error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
