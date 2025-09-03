import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const page = url.searchParams.get("page") || "1";
    const page_size = url.searchParams.get("page_size") || "7";
    const status = url.searchParams.get("status");
    const cookieHeader = req.headers.get("cookie") || "";

    let fastApiUrl = `${process.env.API_URL_SERVER}/invitations/?page=${page}&page_size=${page_size}`;
    if (status) {
      fastApiUrl += `&status=${status}`;
    }

    const res = await fetch(fastApiUrl, {
      headers: {
        "Content-Type": "application/json",
        "Cookie": cookieHeader,
      },
    });

    const data = await res.json();

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Error fetching invitations:", err);
    return NextResponse.json(
      { items: [], total_pages: 0, current_page: 1, total_count: 0, error: "Internal server error" },
      { status: 500 }
    );
  }
}
