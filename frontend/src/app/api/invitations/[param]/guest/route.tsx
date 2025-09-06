import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ param: string }> }
) {

  const { param } = await params;
  const cookieHeader = req.headers.get("cookie") || "";
  const fastApiUrl = `${process.env.API_URL_SERVER}/invitations/guest/${param}`;

  const res = await fetch(fastApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": cookieHeader,
    },
    body: JSON.stringify(await req.json()),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
