import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const jsonBody = await req.json();
  const cookieHeader = req.headers.get("cookie") || "";

  const res = await fetch(`${process.env.API_URL_SERVER}/orders/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: cookieHeader,
    },
    body: JSON.stringify(jsonBody),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
