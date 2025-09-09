"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import styles from "./BlogPost.module.css";
import type { components } from "@/shared/types";

type BlogPostRead = components['schemas']['BlogPostRead'];

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPostRead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`/api/blogposts/${slug}`);
        if (!res.ok) throw new Error("Failed to fetch blog post");
        const data: BlogPostRead = await res.json();
        setPost(data);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  if (loading) return <p className={styles.loading}>Зареждане на поста...</p>;
  if (error || !post) return <p className={styles.empty}>Постът не е намерен.</p>;

  return (
    <div className="container fullHeight centerWrapper">
      <h1 className={styles.title}>{post.title}</h1>
      <p className={styles.meta}>
        {post.authored_by ? `От ${post.authored_by}` : ""} | {new Date(post.created_at).toLocaleDateString()}
      </p>
      {post.image && (
        <div className={styles.imageWrapper}>
          <Image
            src={post.image}
            alt={post.title}
            width={800}
            height={450}
            unoptimized
            style={{ objectFit: "cover", borderRadius: "6px" }}
          />
        </div>
      )}
      <div className={styles.content}>
        {post.paragraphs.map((p, idx) => (
          <p key={idx}>{p}</p>
        ))}
      </div>
    </div>
  );
}
