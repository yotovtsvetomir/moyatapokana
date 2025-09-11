import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import OrderDetailClient from "./OrderDetailClient";
import type { components } from "@/shared/types";

type Order = components["schemas"]["OrderRead"];

async function getOrder(orderNumber: string): Promise<Order | null> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join("; ");

    const res = await fetch(
      `${process.env.API_URL_SERVER}/orders/${orderNumber}`,
      {
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) return null;
    return (await res.json()) as Order;
  } catch (err) {
    console.error("Failed to fetch order:", err);
    return null;
  }
}

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: { order_number: string };
  searchParams: { payment_status?: string };
}) {
  const { order_number } = await params;
  const { payment_status } = await searchParams;
  const order = await getOrder(order_number);
  if (!order) return notFound();

  const paymentStatus = payment_status ?? null;

  return (
    <OrderDetailClient
      order={order}
      paymentStatus={paymentStatus}
    />
  );
}
