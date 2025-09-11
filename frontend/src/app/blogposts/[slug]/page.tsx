import BlogPostClient from './BlogPostClient';
import type { components } from '@/shared/types';

type BlogPostRead = components['schemas']['BlogPostRead'];

async function getPost(slug: string): Promise<BlogPostRead | null> {
  try {
    const res = await fetch(`${process.env.API_URL_SERVER}/blogposts/${slug}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    console.error("Failed to fetch blog post:", err);
    return null;
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const pm = await params;
  const post = await getPost(pm.slug);
  if (!post) return <p>Постът не е намерен.</p>;

  return <BlogPostClient post={post} />;
}
