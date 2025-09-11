'use client';
import { useState } from "react";
import CheckoutForm from "./CheckoutForm";
import type { components } from "@/shared/types";

type Order = components['schemas']['OrderRead'];
type PriceTier = components['schemas']['PriceTierRead'];

export default function CheckoutPageClient({ initialOrderData }: {
  initialOrderData: { order: Order; tiers: PriceTier[]; currencies: string[] }
}) {
  const [order, setOrder] = useState(initialOrderData.order);

  return (
    <CheckoutForm 
      order={order} 
      tiers={initialOrderData.tiers} 
      currencies={initialOrderData.currencies} 
      setOrder={setOrder} 
    />
  );
}
