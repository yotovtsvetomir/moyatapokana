import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ param: string }> }
) {
  const { param } = await params;

  if (!param) {
    return NextResponse.json({ error: "Missing invitation param" }, { status: 400 });
  }

  const isNumericId = /^\d+$/.test(param);
  const backendUrl = isNumericId
    ? `${process.env.API_URL_SERVER}/invitations/${param}`
    : `${process.env.API_URL_SERVER}/invitations/slug/${param}`;

  const res = await fetch(backendUrl, {
    headers: { cookie: req.headers.get("cookie") || "" },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
