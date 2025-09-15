// app/blogposts/[slug]/layout.tsx
import { Metadata } from "next";
import Script from "next/script";
import BlogPostClient from "./BlogPostClient";
import type { components } from "@/shared/types";

type BlogPostRead = components['schemas']['BlogPostRead'];

interface Props {
  params: { slug: string };
}

// Fetch the blog post
async function getPost(slug: string): Promise<BlogPostRead | null> {
  const res = await fetch(`${process.env.API_URL_SERVER}/blogposts/${slug}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

// Generate dynamic metadata for this post
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return { title: "Блог постът не е намерен" };

  const title = post.title;
  const description = post.paragraphs[0].slice(0, 160);
  const url = `${process.env.NEXT_PUBLIC_CLIENT_URL}/blogposts/${post.slug}`;
  const image = post.image || undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url,
      siteName: "moyatapokana.bg",
      images: image ? [image] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
    alternates: {
      canonical: url,
    },
  };
}

// Layout component
export default async function BlogPostLayout({ params }: Props) {
  const post = await getPost(params.slug);

  if (!post) return <p>Блог постът не е намерен.</p>;

  // JSON-LD structured data
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
