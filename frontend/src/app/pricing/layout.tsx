// app/pricing/layout.tsx
import { Metadata } from "next";
import Script from "next/script";
import PricingClient from "./PricingClient";
import type { components } from "@/shared/types";

type PriceTierResponse = components["schemas"]["PriceTierReadWithChoices"];

async function getInitialPricing(currency = "BGN"): Promise<PriceTierResponse> {
  const url = new URL(`${process.env.API_URL_SERVER}/orders/tiers/pricing`);
  url.searchParams.append("currency", currency);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return { tiers: [], currencies: [currency] };
  return res.json();
}

// Generate metadata for pricing page
export async function generateMetadata(): Promise<Metadata> {
  const data = await getInitialPricing();

  const title = "Цени - Moyatapokana.bg";
  const description = "Разгледайте нашите ценови пакети за покани и услуги. Изберете най-подходящия за вас.";
  const url = `${process.env.NEXT_PUBLIC_CLIENT_URL}/pricing`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url,
      siteName: "Moyatapokana.bg",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: url,
    },
  };
}

// Layout component
interface Props {
  children?: React.ReactNode;
}

export default async function PricingLayout({ children }: Props) {
  const data = await getInitialPricing();

  if (!data || !data.tiers || data.tiers.length === 0) {
    return <p>Ценовите пакети не са налични в момента.</p>;
  }

  // JSON-LD structured data for pricing
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Ценови пакети - Moyatapokana.bg",
    description: "Изберете най-подходящия ценови пакет за вашите покани и услуги.",
    offers: data.tiers.map((tier) => ({
      "@type": "Offer",
      priceCurrency: tier.currency,
      price: tier.price.toFixed(2),
      url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/pricing`,
      priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
    })),
  };

  return (
    <>
      {/* JSON-LD */}
      <Script
        id="jsonld-pricing"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Render client component */}
      <PricingClient initialTiers={data.tiers} initialCurrencies={data.currencies} />

      {children}
    </>
  );
}
