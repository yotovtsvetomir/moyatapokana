// app/page.tsx
import { Metadata } from "next";
import Script from "next/script";
import Home from "./Home";
import { Template, BlogPost } from "@/shared/types";

async function getHomeData(): Promise<{ templates: Template[]; blogposts: BlogPost[] }> {
  const res = await fetch(`${process.env.API_URL_SERVER}/home`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) throw new Error("Failed to fetch homepage data");

  return res.json();
}

// SEO + OpenGraph + Twitter metadata
export async function generateMetadata(): Promise<Metadata> {
  const data = await getHomeData();

  const title = "Moyatapokana.bg — Шаблони за покани и блог";
  const description = "Разгледайте най-новите шаблони за покани и статии в блога на Moyatapokana.bg";
  const url = process.env.NEXT_PUBLIC_CLIENT_URL;
  const ogImage = data.templates[0]?.wallpaper || `${url}/default-og.jpg`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "Moyatapokana.bg",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function Page() {
  const { templates, blogposts } = await getHomeData();

  const fontLinks = Array.from(
    new Set(
      templates.map(t => t.font_obj?.font_url).filter(Boolean) as string[]
    )
  );

  // JSON-LD structured data
  const structuredData = [
    // WebSite + SearchAction
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      url: process.env.NEXT_PUBLIC_CLIENT_URL,
      name: "Moyatapokana.bg",
      potentialAction: {
        "@type": "SearchAction",
        target: `${process.env.NEXT_PUBLIC_CLIENT_URL}/templates?search={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
    // WebPage with navigation and ItemLists
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Moyatapokana.bg",
      url: process.env.NEXT_PUBLIC_CLIENT_URL,
      mainEntity: [
        // Navigation links
        {
          "@type": "SiteNavigationElement",
          name: "Templates",
          url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/templates`,
        },
        {
          "@type": "SiteNavigationElement",
          name: "Blog",
          url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/blogposts`,
        },
        {
          "@type": "SiteNavigationElement",
          name: "Pricing",
          url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/pricing`,
        },
        {
          "@type": "SiteNavigationElement",
          name: "Contact",
          url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/contact`,
        },
        {
          "@type": "SiteNavigationElement",
          name: "About",
          url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/about`,
        },
        // Templates ItemList
        {
          "@type": "ItemList",
          name: "Шаблони за покани",
          itemListElement: templates.map((t, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "Product",
              name: t.name,
              url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/template/preview/${t.slug}`,
              image: t.wallpaper,
              description: t.description || "Цифрова покана",
              brand: {
                "@type": "Organization",
                name: "Moyatapokana.bg",
                url: process.env.NEXT_PUBLIC_CLIENT_URL,
              },
              offers: {
                "@type": "Offer",
                url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/template/preview/${t.slug}`,
                priceCurrency: "BGN",
                price: "19.99",
                availability: "https://schema.org/InStock",
              },
            },
          })),
        },
        // Blog posts ItemList
        {
          "@type": "ItemList",
          name: "Блог постове",
          itemListElement: blogposts.map((post, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "BlogPosting",
              headline: post.title,
              url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/blogposts/${post.slug}`,
              image: post.image || undefined,
              datePublished: post.created_at,
              dateModified: post.updated_at,
              author: post.authored_by || "Unknown",
            },
          })),
        },
      ],
    },
  ];

  return (
    <>
      {/* Dynamic fonts */}
      {fontLinks.map((url, i) => (
        <link key={i} rel="stylesheet" href={url} />
      ))}

      {/* JSON-LD */}
      <Script
        id="jsonld-homepage"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <Home templates={templates} blogposts={blogposts} />
    </>
  );
}
