import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  console.log(slug)
  if (!slug) {
    return NextResponse.json({ error: "Missing template slug" }, { status: 400 });
  }

  const res = await fetch(`${process.env.API_URL_SERVER}/blogposts/${slug}`, {
    headers: { cookie: req.headers.get("cookie") || "" },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
