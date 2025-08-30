import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { email, password, first_name, last_name } = body;

  try {
    const cookieHeader = req.headers.get("cookie") || "";

    const response = await fetch(`${process.env.API_URL_SERVER}/users/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      },
      body: JSON.stringify({ email, password, first_name, last_name }),
    });

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json(
        { error: data.detail || "Registration failed" },
        { status: response.status }
      );
    }

    const data = await response.json();

    const res = NextResponse.json({
      success: true,
      message: data.message,
    });

    const isProd = process.env.NODE_ENV === "production";

    // Set new session cookie from backend response
    res.cookies.set("session_id", data.session_id, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      expires: new Date(data.expires_at),
    });

    res.cookies.delete("anonymous_session_id");

    return res;
  } catch (err) {
    console.error("Registration error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
