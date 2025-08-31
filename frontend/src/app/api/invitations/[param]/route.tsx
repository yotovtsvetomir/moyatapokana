import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ param: string }> }
) {
  
  const { param } = await params;

  if (!param) {
    return NextResponse.json({ error: "Missing invitation ID" }, { status: 400 });
  }

  const res = await fetch(`${process.env.API_URL_SERVER}/invitations/${param}`, {
    headers: { cookie: req.headers.get("cookie") || "" },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
