import React from 'react';
import styles from './Heading.module.css';

interface HeadingProps {
  children: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  align?: 'left' | 'center' | 'right';
  weight?: 'medium' | 'semi' | 'bold' | 'extrabold';
  color?: string;
  marginBottom?: string;
}

export const Heading: React.FC<HeadingProps> = ({
  children,
  as: Tag = 'h1',
  size = 'xl',
  align = 'left',
  weight = 'bold',
  color,
  marginBottom,
}) => {
  const isCssVar = color?.startsWith('--');

  const style: React.CSSProperties = {
    ...(isCssVar && { color: `var(${color})` }),
    ...(marginBottom && { marginBottom }),
  };

  const className = [
    styles.heading,
    styles[size],
    styles[align],
    styles[weight],
    !isCssVar && color && styles[color],
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Tag className={className} style={style}>
      {children}
    </Tag>
  );
};
