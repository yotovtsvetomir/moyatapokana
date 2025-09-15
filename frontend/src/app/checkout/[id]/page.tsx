import { cookies } from "next/headers";
import CheckoutPageClient from "./CheckoutPageClient";
import type { components } from "@/shared/types";

type Order = components['schemas']['OrderRead'];
type PriceTier = components['schemas']['PriceTierRead'];

async function getOrder(id: string): Promise<{ order: Order; tiers: PriceTier[]; currencies: string[] } | null> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join("; ");

    const res = await fetch(`${process.env.API_URL_SERVER}/orders/create`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Cookie": cookieHeader
      },
      body: JSON.stringify({ invitation_id: Number(id) }),
      cache: "no-store",
    });

    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    console.error("Failed to fetch order:", err);
    return null;
  }
}

export default async function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  const pm = await params;
  const orderData = await getOrder(pm.id);

  if (!orderData) return <p>Неуспешно зареждане на поръчката</p>;

  return <CheckoutPageClient initialOrderData={orderData} />;
}
