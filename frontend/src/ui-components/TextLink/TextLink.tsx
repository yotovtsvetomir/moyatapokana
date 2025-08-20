import Link from 'next/link';
import styles from './TextLink.module.css';

interface TextLinkProps {
  href: string;
  children: React.ReactNode;
  external?: boolean;
  color?: 'accent' | 'muted';
}

export const TextLink = ({
  href,
  children,
  external = false,
  color = 'accent',
}: TextLinkProps) => {
  const className = `${styles.link} ${styles[color]}`;

  if (external) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
};
