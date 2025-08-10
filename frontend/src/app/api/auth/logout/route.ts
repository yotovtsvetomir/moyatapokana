import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const response = await fetch(`${process.env.API_URL_SERVER}/users/logout`, {
      method: "POST",
      headers: {
        cookie: req.headers.get("cookie") || "",
      },
    });

    if (!response.ok) {
      const data = await response.json();
      return NextResponse.json({ error: data.detail || "Logout failed" }, { status: response.status });
    }

    const res = new NextResponse(null, { status: 204 });
    res.cookies.delete("session_id");

    return res;
  } catch (error) {
    return NextResponse.json({ error: "Server error: " + error }, { status: 500 });
  }
}
