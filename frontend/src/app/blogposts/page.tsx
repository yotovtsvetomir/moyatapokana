import BlogPostsClient from './BlogPostsClient';
import type { components } from '@/shared/types';

type BlogPostRead = components['schemas']['BlogPostRead'];

async function getPosts(): Promise<BlogPostRead[]> {
  const res = await fetch(`${process.env.API_URL_SERVER}/blogposts/`, { cache: 'no-store' });
  if (!res.ok) return [];
  return res.json();
}

export default async function BlogPostsPage() {
  const posts = await getPosts();
  return <BlogPostsClient posts={posts} />;
}
