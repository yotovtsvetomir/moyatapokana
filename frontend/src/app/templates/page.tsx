import Head from "next/head";
import TemplatesClient from "./TemplatesClient";
import type { TemplatesApiResponse } from "./types";

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] };
}) {
  const sp = await searchParams;
  const search = typeof sp?.search === "string" ? sp.search : "";

  const res = await fetch(
    `${process.env.API_URL_SERVER}/invitations/templates/list/view?search=${encodeURIComponent(search)}`,
    { cache: "no-store" }
  );
  const data: TemplatesApiResponse = await res.json();
  const firstTemplate = data.templates.items[0];

  const structuredData = firstTemplate
    ? {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        name: firstTemplate.title,
        description: firstTemplate.description || "Визуализирай шаблони",
        image: firstTemplate.wallpaper,
        url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/templates/preview/${firstTemplate.slug}`,
      }
    : {
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: data.templates.items.map((t, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/templates/preview/${t.slug}`,
          name: t.title,
          image: t.wallpaper,
          description: t.description || "",
        })),
      };

  return (
    <>
      <Head>
        <title>{firstTemplate?.title ?? "Шаблони"}</title>
        <meta
          name="description"
          content={firstTemplate?.description ?? "Визуализирай шаблони"}
        />

        {/* OpenGraph */}
        <meta property="og:title" content={firstTemplate?.title ?? "Шаблони"} />
        <meta
          property="og:description"
          content={firstTemplate?.description ?? "Визуализирай шаблони"}
        />
        <meta
          property="og:url"
          content={
            firstTemplate
              ? `${process.env.NEXT_PUBLIC_CLIENT_URL}/templates/preview/${firstTemplate.slug}`
              : `${process.env.NEXT_PUBLIC_CLIENT_URL}/templates`
          }
        />
        {firstTemplate?.wallpaper && (
          <meta property="og:image" content={firstTemplate.wallpaper} />
        )}
        <meta
          property="og:type"
          content={firstTemplate ? "article" : "website"}
        />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={firstTemplate?.title ?? "Шаблони"} />
        <meta
          name="twitter:description"
          content={firstTemplate?.description ?? "Визуализирай шаблони"}
        />
        {firstTemplate?.wallpaper && (
          <meta name="twitter:image" content={firstTemplate.wallpaper} />
        )}

        {/* JSON-LD structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </Head>

      <TemplatesClient
        initialData={data}
        initialSearch={search}
        initialCategories={data.filters.categories}
      />
    </>
  );
}
