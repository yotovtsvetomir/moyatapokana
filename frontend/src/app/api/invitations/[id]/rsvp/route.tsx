import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {

  const { id } = await params;
  const cookieHeader = req.headers.get("cookie") || "";
  const fastApiUrl = `${process.env.API_URL_SERVER}/invitations/rsvp/${id}`;

  const res = await fetch(fastApiUrl, {
    headers: {
      "Content-Type": "application/json",
      "Cookie": cookieHeader,
    },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
