import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  try {
    const response = await fetch(
      `${process.env.API_URL_SERVER}/users/anonymous-session`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cookie": req.headers.get("cookie") || "",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.detail || "Anonymous session creation failed" },
        { status: response.status }
      );
    }

    const res = NextResponse.json(data);
    const isProd = process.env.NODE_ENV === "production";

    // --- short-lived anonymous session ---
    res.cookies.set("anonymous_session_id", data.anonymous_session_id, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      path: "/",
      expires: new Date(data.expires_at),
    });

    // --- long-lived unique_id ---
    // backend should already return unique_id, but fallback to uuid if missing
    const uniqueId = data.unique_id ?? uuidv4();
    res.cookies.set("unique_id", uniqueId, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    return res;
  } catch (err) {
    console.error("Anonymous session error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
