import Script from "next/script";
import Home from "./Home";
import type { components } from '@/shared/types';

type TemplateRead = components['schemas']['TemplateRead'];
type BlogPostRead = components['schemas']['BlogPostOut'];

async function getHomeData(): Promise<{ templates: TemplateRead[]; blogposts: BlogPostRead[] }> {
  const res = await fetch(`${process.env.API_URL_SERVER}/home`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) throw new Error("Failed to fetch homepage data");

  return res.json();
}

export default async function Page() {
  const { templates, blogposts } = await getHomeData();

  const data = await getHomeData();

  const title = `${process.env.NEXT_PUBLIC_NAME} — Шаблони за покани`;
  const description = `Разгледайте най-новите шаблони за покани на ${process.env.NEXT_PUBLIC_NAME}`;
  const url = process.env.NEXT_PUBLIC_CLIENT_URL || "https://моятапокана.бг";
  const image = data.templates[0]?.wallpaper || `${url}/default-og.jpg`;

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
      url: process.env.NEXT_PUBLIC_NAME,
      name: process.env.NEXT_PUBLIC_CLIENT_URL,
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
      name: process.env.NEXT_PUBLIC_NAME,
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
              name: t.title,
              url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/шаблон/преглед/${t.slug}`,
              image: t.wallpaper,
              description: t.description || "Цифрова покана",
              brand: {
                "@type": "Organization",
                name: "Moyatapokana.bg",
                url: process.env.NEXT_PUBLIC_CLIENT_URL,
              },
              offers: {
                "@type": "Offer",
                url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/цени`,
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
              url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/блогпост/${post.slug}`,
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
      <head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={url} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Moyatapokana.bg" />
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
