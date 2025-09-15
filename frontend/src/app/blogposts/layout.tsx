// app/blogposts/layout.tsx
import { Metadata } from "next";
import Script from "next/script";
import BlogPostsClient from "./BlogPostsClient";
import type { components } from "@/shared/types";

type BlogPostRead = components['schemas']['BlogPostRead'];

async function getPosts(): Promise<BlogPostRead[]> {
  const res = await fetch(`${process.env.API_URL_SERVER}/blogposts/`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

// Generate Metadata for SEO / OpenGraph / Twitter
export async function generateMetadata(): Promise<Metadata> {
  const posts = await getPosts();

  const title = "Блог";
  const description = "Последните блог постове от нашия сайт.";
  const url = `${process.env.NEXT_PUBLIC_CLIENT_URL}/blogposts`;
  const siteName = "moyatapokana.bg";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url,
      siteName,
      images: posts[0]?.image ? [posts[0].image] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: posts[0]?.image ? [posts[0].image] : undefined,
    },
    alternates: {
      canonical: url,
    },
  };
}

// Layout component
interface Props {
  children: React.ReactNode;
}

export default async function BlogPostsLayout({ children }: Props) {
  const posts = await getPosts();

  if (!posts || posts.length === 0) return <p>Няма намерени блог постове.</p>;

  // JSON-LD structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Блог",
    description: "Последните блог постове от нашия сайт.",
    url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/blogposts`,
    blogPost: posts.map(post => ({
      "@type": "BlogPosting",
      headline: post.title,
      author: post.authored_by || "Unknown",
      datePublished: post.created_at,
      dateModified: post.updated_at,
      url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/blogposts/${post.slug}`,
      image: post.image || undefined,
      description: post.paragraphs[0].slice(0, 120),
    })),
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

      {/* Render client component with posts */}
      <BlogPostsClient posts={posts}>
        {children}
      </BlogPostsClient>
    </>
  );
}
