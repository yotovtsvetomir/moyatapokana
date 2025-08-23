import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  try {
    const cookieStore = req.headers.get("cookie") || "";
    const body = await req.json();

    const res = await fetch(`${process.env.API_URL_SERVER}/users/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        cookie: cookieStore,
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.detail || "Update failed" },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("Update error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
