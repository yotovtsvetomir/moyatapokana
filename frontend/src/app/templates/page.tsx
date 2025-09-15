// app/templates/page.tsx
import { Metadata } from "next";
import Script from "next/script";
import TemplatesClient from "./TemplatesClient";
import type { TemplatesApiResponse } from "./types";

type Props = {
  searchParams: { [key: string]: string | string[] | undefined };
};

// Generate SEO metadata
export async function generateMetadata({ searchParams }: { searchParams: Props["searchParams"] }): Promise<Metadata> {
  const getParam = (param?: string | string[]) =>
    Array.isArray(param) ? param[0] : param || "";

  const search = getParam(searchParams?.search);
  const category = getParam(searchParams?.category);
  const subcategory = getParam(searchParams?.subcategory);
  const variant = getParam(searchParams?.variant);

  let queryString = "";
  if (search) queryString += `search=${encodeURIComponent(search)}&`;
  if (category) queryString += `category=${encodeURIComponent(category)}&`;
  if (subcategory) queryString += `subcategory=${encodeURIComponent(subcategory)}&`;
  if (variant) queryString += `variant=${encodeURIComponent(variant)}&`;
  queryString = queryString ? "?" + queryString.replace(/&$/, "") : "";

  const res = await fetch(
    `${process.env.API_URL_SERVER}/invitations/templates/list/view?${queryString}`,
    { cache: "no-store" }
  );
  const data: TemplatesApiResponse = await res.json();

  const title = "Шаблони за покани";
  const description = "Разгледайте шаблоните за покани";
  const url = `https://www.moyatapokana.bg/templates${queryString}`;
  const image = data.templates.items[0]?.wallpaper || "/fallback.jpg";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [image],
      type: "website",
      url,
    },
    alternates: {
      canonical: url,
    },
  };
}

// Page component
export default async function TemplatesPage({ searchParams }: Props) {
  const getParam = (param?: string | string[]) =>
    Array.isArray(param) ? param[0] : param || "";

  const search = getParam(searchParams?.search);
  const category = getParam(searchParams?.category);
  const subcategory = getParam(searchParams?.subcategory);
  const variant = getParam(searchParams?.variant);

  let queryString = "";
  if (search) queryString += `search=${encodeURIComponent(search)}&`;
  if (category) queryString += `category=${encodeURIComponent(category)}&`;
  if (subcategory) queryString += `subcategory=${encodeURIComponent(subcategory)}&`;
  if (variant) queryString += `variant=${encodeURIComponent(variant)}&`;
  queryString = queryString ? "?" + queryString.replace(/&$/, "") : "";

  const res = await fetch(
    `${process.env.API_URL_SERVER}/invitations/templates/list/view?${queryString}`,
    { cache: "no-store" }
  );
  const data: TemplatesApiResponse = await res.json();

  // Structured data JSON-LD
  const structuredData = {
  "@context": "https://schema.org",
  "@type": "ItemList",
    name: "Шаблони за покани",
    description: "Разгледайте шаблоните за покани",
    url: `https://www.moyatapokana.bg/templates${queryString}`,
    numberOfItems: data.templates.items.length,
    itemListElement: data.templates.items.map((t, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: t.name,
        image: t.wallpaper,
        url: `https://www.moyatapokana.bg/template/preview/${t.slug}`,
        description: t.description || "Цифрова покана",
        brand: {
          "@type": "Organization",
          name: "Moyatapokana.bg",
          url: "https://www.moyatapokana.bg"
        },
        offers: {
          "@type": "Offer",
          url: `https://www.moyatapokana.bg/template/preview/${t.slug}`,
          priceCurrency: "BGN",
          price: "19.99",
          availability: "https://schema.org/InStock",
        }
      }
    }))
  };

  const fontLinks = Array.from(
    new Set(
      data.templates.items
        .map(t => t.font_obj?.font_url)
        .filter(Boolean) as string[]
    )
  );

  return (
    <>
      {/* JSON-LD structured data */}
      <Script
        id="jsonld"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Font links */}
      {fontLinks.map((url, i) => (
        <link key={i} rel="stylesheet" href={url} />
      ))}

      <TemplatesClient
        initialData={data}
        initialSearch={search}
        initialCategories={data.filters.categories}
      />
    </>
  );
}
