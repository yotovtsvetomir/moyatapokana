import Script from "next/script";
import TemplatesClient from "./TemplatesClient";
import type { components } from '@/shared/types';

type TemplateRead = components['schemas']['TemplateRead'];

interface Variant {
  id: number;
  name: string;
  slug: string;
}

interface Subcategory {
  id: number;
  name: string;
  slug: string;
  variants: Variant[];
}

interface Category {
  id: number;
  name: string;
  slug: string;
  subcategories: Subcategory[];
}

interface Filters {
  categories: Category[];
}

interface TemplatesApiResponse {
  templates: {
    total_count: number;
    current_page: number;
    page_size: number;
    total_pages: number;
    items: TemplateRead[];
  };
  filters: Filters;
  error?: string;
}

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// Page component
export default async function TemplatesPage({ searchParams }: Props) {
  const sp = await searchParams
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
    `${process.env.API_URL_SERVER}/invitations/templates/list/view${queryString}`,
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
        name: t.title,
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

  const title = "Шаблони за покани";
  const description = "Разгледайте шаблоните за покани";
  const url = `https://www.moyatapokana.bg/templates${queryString}`;
  const image = data.templates.items[0]?.wallpaper || "/fallback.jpg";

  const fontLinks = Array.from(
    new Set(
      data.templates.items
        .map(t => t.font_obj?.font_url)
        .filter(Boolean) as string[]
    )
  );

  return (
    <>
      <head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={url} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={url} />
        <meta property="og:image" content={image} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={image} />
      </head>

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
