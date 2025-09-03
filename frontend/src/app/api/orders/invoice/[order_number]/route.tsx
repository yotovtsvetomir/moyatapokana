import { NextRequest } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ order_number: string }> }
) {
  const { order_number } = await params;

  if (!order_number) {
    return new Response("Missing order_number", { status: 400 });
  }

  const res = await fetch(`${process.env.API_URL_SERVER}/orders/invoice/${order_number}`, {
    method: "POST",
    headers: {
      cookie: req.headers.get("cookie") || "",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    return new Response(text, { status: res.status });
  }

  return new Response(res.body, {
    status: res.status,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice_${order_number}.pdf"`,
    },
  });
}
