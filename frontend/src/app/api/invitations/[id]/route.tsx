import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Missing invitation ID" }, { status: 400 });
  }

  const res = await fetch(`${process.env.API_URL_SERVER}/invitations/${id}`, {
    headers: { cookie: req.headers.get("cookie") || "" },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
