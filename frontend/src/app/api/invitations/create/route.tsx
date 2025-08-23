import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const res = await fetch(`${process.env.API_URL_SERVER}/invitations/create`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      cookie: req.headers.get("cookie") || "",
    },
  });

  if (!res.ok) {
    const errorData = await res.json();
    return NextResponse.json(
      { error: errorData.detail || "Failed to create invitation" },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
