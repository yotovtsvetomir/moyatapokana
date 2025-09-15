import React from 'react';
import styles from './Input.module.css';

interface InputProps {
  id: string;
  name: string;
  type?: React.HTMLInputTypeAttribute;
  value: string;
  error?: string | null;
  hint?: string; // new prop for helper text
  placeholder?: string;
  label?: string;
  icon?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  required?: boolean;
  disabled?: boolean;
  color?: string;
  size?: 'default' | 'large' | 'small';
}

export const Input: React.FC<InputProps> = ({
  id,
  name,
  type = 'text',
  value,
  error,
  hint, // destructure hint
  placeholder = ' ',
  label,
  icon,
  onChange,
  onFocus,
  required = false,
  disabled = false,
  color,
  size
}) => {
  return (
    <div 
      style={
        color
          ? { '--focus-border-color': color } as React.CSSProperties
          : undefined
      }
      className={`${styles.inputGroup} ${error ? styles.hasMessage : ''}`}
    >
      <input
        type={type}
        id={id}
        name={name}
        autoComplete={type === "password" ? "" : type}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        className={`${styles.input} ${styles.floatingInput} ${
          error ? styles.inputError : ''
        } ${size === 'large' ? styles.inputLarge : ''}`}
        required={required}
        placeholder={placeholder}
        disabled={disabled}
      />
      <label
        htmlFor={id}
        className={`${styles.floatingLabel} ${icon ? styles.labelWithIcon : ''}`}
      >
        {icon && (
          <span className={`material-symbols-outlined ${styles.labelIcon}`}>
            {icon}
          </span>
        )}
        {label}
      </label>

      {/* Error message */}
      <p className={`${styles.errorMessage} ${error ? styles.show : ''}`}>
        {error}
      </p>

      {/* Hint message */}
      {hint && <p className={styles.hintMessage}>{hint}</p>}
    </div>
  );
};
