import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const cookieHeader = req.headers.get("cookie") || "";
    const fastApiUrl = `${process.env.API_URL_SERVER}/invitations/templates/list/view${url.search}`;

    const res = await fetch(fastApiUrl, {
      headers: {
        "Content-Type": "application/json",
        "Cookie": cookieHeader,
      },
    });

    const data = await res.json();

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Error fetching templates:", err);
    return NextResponse.json(
      {
        templates: {
          items: [],
          total_pages: 0,
          current_page: 1,
          total_count: 0,
        },
        filters: {
          categories: [],
          subcategories: [],
        },
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
