import Script from "next/script";
import BlogPostClient from "./BlogPostClient";
import type { components } from "@/shared/types";

type BlogPostRead = components['schemas']['BlogPostRead'];

interface Props {
  params: { slug: string };
}

async function getPost(slug: string): Promise<BlogPostRead | null> {
  const res = await fetch(`${process.env.API_URL_SERVER}/blogposts/${slug}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export default async function BlogPostLayout({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) return <p>Блог постът не е намерен.</p>;

  // Optional structured data for JSON-LD
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    author: post.authored_by || "Unknown",
    datePublished: post.created_at,
    dateModified: post.updated_at,
    url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/blogposts/${post.slug}`,
    image: post.image || undefined,
    description: post.paragraphs[0].slice(0, 120),
  };

  return (
    <>
      <head>
        <title>{post.title}</title>
        <meta name="description" content={post.paragraphs[0].slice(0, 160)} />

        {/* Open Graph */}
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.paragraphs[0].slice(0, 160)} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_CLIENT_URL}/blogposts/${post.slug}`} />
        {post.image && <meta property="og:image" content={post.image} />}
        <meta property="og:site_name" content="moyatapokana.bg" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.paragraphs[0].slice(0, 160)} />
        {post.image && <meta name="twitter:image" content={post.image} />}
      </head>

      {/* JSON-LD */}
      <Script
        id="jsonld"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Render the client component */}
      <BlogPostClient post={post} />
    </>
  );
}
