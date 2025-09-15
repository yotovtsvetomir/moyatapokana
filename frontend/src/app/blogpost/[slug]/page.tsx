import Script from "next/script";
import Head from "next/head";
import BlogPostClient from "./BlogPostClient";
import type { components } from "@/shared/types";

type BlogPostRead = components['schemas']['BlogPostOut'];

interface Props {
  params: Promise<{ slug: string }>;
}

async function getPost(slug: string): Promise<BlogPostRead | null> {
  const res = await fetch(`${process.env.API_URL_SERVER}/blogposts/${slug}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

// Page component
export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) return <p>Блог постът не е намерен.</p>;

  const title = post.title;
  const description = post.paragraphs[0]?.slice(0, 160) || "";
  const url = `${process.env.NEXT_PUBLIC_CLIENT_URL}/blogpost/${post.slug}`;
  const image = post.image || undefined;

  // JSON-LD structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    author: post.authored_by || "Unknown",
    datePublished: post.created_at,
    dateModified: post.updated_at,
    url,
    image,
    description: post.paragraphs[0]?.slice(0, 120),
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        {description && <meta name="description" content={description} />}
        <link rel="canonical" href={url} />

        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="moyatapokana.bg" />
        <meta property="og:title" content={title} />
        {description && <meta property="og:description" content={description} />}
        <meta property="og:url" content={url} />
        {image && <meta property="og:image" content={image} />}

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        {description && <meta name="twitter:description" content={description} />}
        {image && <meta name="twitter:image" content={image} />}
      </Head>

      {/* JSON-LD */}
      <Script
        id="jsonld"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Client component */}
      <BlogPostClient post={post} />
    </>
  );
}
