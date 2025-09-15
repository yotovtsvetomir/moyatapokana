// app/blogposts/page.tsx
import Head from "next/head";
import Script from "next/script";
import BlogPostsClient from "./BlogPostsClient";
import type { components } from "@/shared/types";

type BlogPostRead = components['schemas']['BlogPostOut'];

// Fetch all blog posts
async function getPosts(): Promise<BlogPostRead[]> {
  const res = await fetch(`${process.env.API_URL_SERVER}/blogposts/`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

// Page component
export default async function BlogPostsPage() {
  const posts = await getPosts();

  if (!posts || posts.length === 0) return <p>Няма намерени блог постове.</p>;

  const title = "Блог";
  const description = "Последните блог постове от нашия сайт.";
  const url = `${process.env.NEXT_PUBLIC_CLIENT_URL}/blogposts`;
  const image = posts[0]?.image;

  // JSON-LD structured data
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: title,
    description,
    url,
    blogPost: posts.map(post => ({
      "@type": "BlogPosting",
      headline: post.title,
      author: post.authored_by || "Unknown",
      datePublished: post.created_at,
      dateModified: post.updated_at,
      url: `${process.env.NEXT_PUBLIC_CLIENT_URL}/blogposts/${post.slug}`,
      image: post.image || undefined,
      description: post.paragraphs[0]?.slice(0, 120),
    })),
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={url} />

        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="https://www.moyatapokana.bg" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={url} />
        {image && <meta property="og:image" content={image} />}

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        {image && <meta name="twitter:image" content={image} />}
      </Head>

      {/* JSON-LD */}
      <Script
        id="jsonld"
        type="application/ld+json"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Render client component with posts */}
      <BlogPostsClient home={false} posts={posts} />
    </>
  );
}
