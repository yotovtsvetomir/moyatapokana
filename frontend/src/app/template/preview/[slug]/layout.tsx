import Script from "next/script";
import { TemplateProvider } from "@/context/TemplateContext";
import { components } from "@/shared/types";

type TemplateRead = components['schemas']['TemplateRead'];

async function getTemplateBySlug(slug: string): Promise<TemplateRead | null> {
  const res = await fetch(`${process.env.API_URL_SERVER}/invitations/templates/${slug}`, {
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

interface Props {
  children: React.ReactNode;
  params: { slug: string };
}

export default async function PreviewTemplateLayout({ children, params }: Props) {
  const pm = await params;
  const template = await getTemplateBySlug(pm.slug);
  if (!template) return <p>Шаблонът не е намерен.</p>;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: template.title,
    description: template.description,
    image: template.wallpaper,
    url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/template/preview/${pm.slug}`,
    author: { "@type": "Organization", name: "moyatapokana.bg" },
  };

  return (
    <>
      <head>
        <title>{template.title}</title>
        <meta name="description" content={template.description ?? ""} />

        {/* Open Graph */}
        <meta property="og:title" content={template.title} />
        <meta property="og:description" content={template.description ?? ""} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_CLIENT_URL}/template/preview/${pm.slug}`} />
        {template.wallpaper && <meta property="og:image" content={template.wallpaper} />}
        <meta property="og:site_name" content="moyatapokana.bg" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={template.title} />
        <meta name="twitter:description" content={template.description ?? ""} />
        {template.wallpaper && <meta name="twitter:image" content={template.wallpaper} />}
      </head>

      {/* JSON-LD */}
      <Script
        id="jsonld"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <TemplateProvider initialTemplate={template}>
        {children}
      </TemplateProvider>
    </>
  );
}
