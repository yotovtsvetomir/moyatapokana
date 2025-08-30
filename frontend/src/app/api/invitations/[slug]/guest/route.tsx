import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {

  const { slug } = await params;
  const cookieHeader = req.headers.get("cookie") || "";
  const fastApiUrl = `${process.env.API_URL_SERVER}/invitations/guest/${slug}`;

  const res = await fetch(fastApiUrl, {
    headers: {
      "Content-Type": "application/json",
      "Cookie": cookieHeader,
    },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
