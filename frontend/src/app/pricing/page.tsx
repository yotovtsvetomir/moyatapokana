import PricingClient from "./PricingClient";
import type { components } from "@/shared/types";

type PriceTierResponse = components["schemas"]["PriceTierReadWithChoices"];

async function getInitialTiers(): Promise<PriceTierResponse | null> {
  try {
    const res = await fetch(
      `${process.env.API_URL_SERVER}/orders/tiers/pricing`,
      {
        headers: { "Content-Type": "application/json" },
        cache: "no-store"
      }
    );
    if (!res.ok) return null;
    return (await res.json()) as PriceTierResponse;
  } catch (err) {
    console.error("Failed to fetch initial tiers:", err);
    return null;
  }
}

export default async function PricingPage() {
  const initialData = await getInitialTiers();

  if (!initialData) {
    return (
      <div className="container fullHeight centerWrapper">
        <p>Неуспешно зареждане на цените.</p>
      </div>
    );
  }

  return (
    <PricingClient
      initialTiers={initialData.tiers}
      initialCurrencies={initialData.currencies}
    />
  );
}
