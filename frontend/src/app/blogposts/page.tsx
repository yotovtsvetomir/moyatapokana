"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from '@/ui-components/Button/Button'
import styles from "./BlogPosts.module.css";
import type { components } from '@/shared/types';

type BlogPostRead = components['schemas']['BlogPostRead'];

export default function BlogPostsPage() {
  const [posts, setPosts] = useState<BlogPostRead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch("/api/blogposts");
        if (!res.ok) throw new Error("Неуспешно зареждане на блог постове");
        const data: BlogPostRead[] = await res.json();
        setPosts(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  if (loading) return <p className={styles.loading}>Зареждане на блог постове...</p>;
  if (posts.length === 0) return <p className={styles.empty}>Няма намерени блог постове.</p>;

  return (
    <div className="container fullHeight centerWrapper">
      <h1 className={styles.heading}>Блог</h1>

      <div className={styles.grid}>
        {posts.map((post) => (
          <div key={post.id} className={styles.card}>
            {post.image && (
              <div className={styles.imageWrapper}>
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  className={styles.image}
                  unoptimized
                  style={{ objectFit: 'cover' }}
                />
              </div>
            )}
            <h2 className={styles.title}>{post.title}</h2>
            <p className={styles.author}>{post.authored_by ? `От ${post.authored_by}` : ""}</p>
            <p className={styles.date}>
              {new Date(post.updated_at).toLocaleDateString("bg-BG", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric"
              })}
            </p>
            <p className={styles.excerpt}>{post.paragraphs[0].slice(0, 120)}...</p>
            <div className={styles.cardActions}>
              <Button
                variant="primary"
                width="100%"
                icon="article"
                iconPosition="left"
                href={`/blogposts/${post.slug}`}
              >
                Прочети повече
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
