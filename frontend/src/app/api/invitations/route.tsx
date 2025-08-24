import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const invitationId = searchParams.get("id");

  if (!invitationId) {
    return NextResponse.json({ error: "Missing invitation ID" }, { status: 400 });
  }

  console.log(req.headers.get("cookie"))

  const res = await fetch(`${process.env.API_URL_SERVER}/invitations/${invitationId}`, {
    headers: { cookie: req.headers.get("cookie") || "" },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
