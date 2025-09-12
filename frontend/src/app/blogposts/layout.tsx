import Script from "next/script";
import BlogPostsClient from "./BlogPostsClient";
import type { components } from "@/shared/types";

type BlogPostRead = components['schemas']['BlogPostRead'];

interface Props {
  children: React.ReactNode;
}

async function getPosts(): Promise<BlogPostRead[]> {
  const res = await fetch(`${process.env.API_URL_SERVER}/blogposts/`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

export default async function BlogPostsLayout({ children }: Props) {
  const posts = await getPosts();

  if (!posts || posts.length === 0) return <p>Няма намерени блог постове.</p>;

  // Optional: structured data for JSON-LD
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
    }))
  };

  return (
    <>
      <head>
        <title>Блог</title>
        <meta name="description" content="Последните блог постове от нашия сайт." />

        {/* Open Graph */}
        <meta property="og:title" content="Блог" />
        <meta property="og:description" content="Последните блог постове от нашия сайт." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${process.env.NEXT_PUBLIC_CLIENT_URL}/blogposts`} />
        <meta property="og:site_name" content="moyatapokana.bg" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Блог" />
        <meta name="twitter:description" content="Последните блог постове от нашия сайт." />
      </head>

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
