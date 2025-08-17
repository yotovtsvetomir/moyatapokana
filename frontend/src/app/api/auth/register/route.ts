import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { username, password, first_name, last_name } = body;

  try {
    const response = await fetch(`${process.env.API_URL_SERVER}/users/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, first_name, last_name }),
    });

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json({ error: data.detail || "Registration failed" }, { status: response.status });
    }

    const data = await response.json();

    const res = NextResponse.json({ success: true, message: data.message });

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
    console.error("Registration error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
