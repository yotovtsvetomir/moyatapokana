import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import OrdersClient from "./OrdersClient";
import type { components } from "@/shared/types";

type Order = components["schemas"]["OrderRead"];

interface OrdersResponse {
  items: Order[];
  total_pages: number;
}

async function getOrders(page: number, status: string) {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join("; ");

    const statusParam = status === "all" ? "" : `&status=${status}`;
    const res = await fetch(
      `${process.env.API_URL_SERVER}/orders?page=${page}&page_size=7${statusParam}`,
      {
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) return null;
    return (await res.json()) as OrdersResponse;
  } catch (err) {
    console.error("Failed to fetch orders:", err);
    return null;
  }
}

export default async function OrdersPage() {
  const initialData = await getOrders(1, "all");
  if (!initialData) return notFound();

  return <OrdersClient initialData={initialData} />;
}
