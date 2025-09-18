import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const response = await fetch(`${process.env.API_URL_SERVER}/users/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": req.headers.get("cookie") || "",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.detail || "Login failed" }, { status: response.status });
    }

    const res = NextResponse.json({ success: true, message: data.message });

    const isProd = process.env.NODE_ENV === "production";

    // Set the real session cookie
    res.cookies.set("session_id", data.session_id, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      path: "/",
      expires: new Date(data.expires_at),
    });

    // Delete the anonymous session cookie if it exists
    res.cookies.delete("anonymous_session_id");

    return res;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
