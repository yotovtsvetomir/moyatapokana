'use client';

import Image from 'next/image';
import styles from './BlogPost.module.css';
import type { components } from '@/shared/types';

type BlogPostRead = components['schemas']['BlogPostRead'];

interface Props {
  post: BlogPostRead;
}

export default function BlogPostClient({ post }: Props) {
  return (
    <div className="container fullHeight centerWrapper">
      <h1 className={styles.title}>{post.title}</h1>
      <p className={styles.meta}>
        {post.authored_by ? `От ${post.authored_by}` : ''} {' / '}
        {new Date(post.updated_at).toLocaleDateString('bg-BG', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })}
      </p>
      {post.image && (
        <div className={styles.imageWrapper}>
          <Image
            src={post.image}
            alt={post.title}
            width={800}
            height={450}
            unoptimized
            style={{ objectFit: 'cover', borderRadius: '6px' }}
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
