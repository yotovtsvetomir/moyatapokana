import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const { username, password } = body;

  const formBody = new URLSearchParams();
  formBody.append("username", username);
  formBody.append("password", password);
  formBody.append("scope", "");

  try {
    const response = await fetch(`${process.env.API_URL_SERVER}/users/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formBody.toString(),
    });

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json({ error: data.detail || "Login failed" }, { status: response.status });
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
    console.error("Login error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
