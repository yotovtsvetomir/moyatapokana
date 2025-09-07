import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;


  if (!slug) {
    return NextResponse.json({ error: "Missing template slug" }, { status: 400 });
  }

  const res = await fetch(`${process.env.API_URL_SERVER}/invitations/templates/${slug}`, {
    headers: { cookie: req.headers.get("cookie") || "" },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
