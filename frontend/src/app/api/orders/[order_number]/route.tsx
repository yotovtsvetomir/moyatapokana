import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ order_number: string }> }
) {
  
  const { order_number } = await params;

  if (!order_number) {
    return NextResponse.json({ error: "Missing order order_number" }, { status: 400 });
  }

  console.log(order_number)

  const res = await fetch(`${process.env.API_URL_SERVER}/orders/${order_number}`, {
    headers: { cookie: req.headers.get("cookie") || "" },
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
