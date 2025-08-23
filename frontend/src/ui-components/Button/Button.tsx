import React from 'react';
import styles from './Button.module.css';

interface ButtonProps {
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'default' | 'large' | 'middle';
  width?: string | number;
  disabled?: boolean;
  loading?: boolean;
  bold?: boolean;
  onClick?: () => void;
  color?: string;
  href?: string;
  target?: string;
  rel?: string;
  icon?: string;
  iconPosition?: 'left' | 'right';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'default',
  width,
  color,
  disabled = false,
  loading = false,
  bold = false,
  onClick,
  href,
  target,
  icon,
  iconPosition,
  rel,
}) => {
  // Determine size class
  let sizeClass = '';
  if (size === 'large') {
    sizeClass = styles.large;
  } else if (size === 'middle') {
    sizeClass = styles.middle;
  } else {
    sizeClass = styles.default;
  }

  const boldStyle = bold ? styles.bold : '';

  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        className={`${styles.button} ${styles[variant]} ${sizeClass} ${boldStyle}`}
        style={{
          width,
          borderColor: color,
          color: color || undefined,
          pointerEvents: disabled ? 'none' : 'auto',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {loading && <span className={styles.spinner} />}
        <span
          className={`${styles.content} ${
            icon && iconPosition === 'left'
              ? styles.shiftRight
              : icon && iconPosition === 'right'
              ? styles.shiftLeft
              : ''
          }`}
          style={{ fontWeight: bold ? 'bold' : 'normal' }}
        >
          {icon && iconPosition === 'left' && (
            <span className="material-symbols-outlined">{icon}</span>
          )}
          {children}
          {icon && iconPosition === 'right' && (
            <span className="material-symbols-outlined">{icon}</span>
          )}
        </span>
      </a>
    );
  }

  return (
    <button
      type={type}
      className={`${styles.button} ${styles[variant]} ${sizeClass} ${boldStyle}`}
      style={{
        width,
        borderColor: color,
        color: color || undefined,
      }}
      disabled={disabled || loading}
      onClick={type === "submit" ? undefined : onClick}
    >
      {loading && <span className={styles.spinner} />}
      <span
        className={`${styles.content} ${
          icon && iconPosition === 'left'
            ? styles.shiftRight
            : icon && iconPosition === 'right'
            ? styles.shiftLeft
            : ''
        }`}
        style={{ fontWeight: bold ? 'bold' : 'normal' }}
      >
        {icon && iconPosition === 'left' && (
          <span className="material-symbols-outlined">{icon}</span>
        )}
        {children}
        {icon && iconPosition === 'right' && (
          <span className="material-symbols-outlined">{icon}</span>
        )}
</span>
    </button>
  );
};
