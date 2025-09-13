import TemplatesClient from "./TemplatesClient";
import type { TemplatesApiResponse } from "./types";
import Script from "next/script";

export default async function TemplatesPage({
  children,
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams;

  const getParam = (param?: string | string[]) =>
    Array.isArray(param) ? param[0] : param || "";

  const search = getParam(sp?.search);
  const category = getParam(sp?.category);
  const subcategory = getParam(sp?.subcategory);
  const variant = getParam(sp?.variant);

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

  // Build structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Templates",
    "description": "Browse templates for invitations",
    "url": `https://www.moyatapokana.bg/templates${queryString}`,
    "numberOfItems": data.templates.items.length,
    "itemListElement": data.templates.items.map((t, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": t.name,
      "url": `https://www.moyatapokana.bg/template/preview/${t.slug}`,
    })),
  };

  return (
    <>
      <head>
        <title>Шаблони за покани</title>
        <meta name="description" content="Разгледайте шаблоните за покани" />
        <meta property="og:title" content="Шаблони за покани" />
        <meta property="og:description" content="Разгледайте шаблоните за покани" />
        <meta property="og:image" content={data.templates.items[0].wallpaper} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://www.moyatapokana.bg/templates${queryString}`} />

        {/* Structured data */}
        <Script
          id="jsonld"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>

      <TemplatesClient
        initialData={data}
        initialSearch={search}
        initialCategories={data.filters.categories}
      >
        {children}
      </TemplatesClient>
    </>
  );
}
