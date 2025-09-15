import React from 'react';
import styles from './Input.module.css';

interface TextareaProps {
  id: string;
  name: string;
  value: string;
  error?: string;
  hint?: string;
  placeholder?: string;
  label?: string;
  icon?: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onFocus?: () => void;
  required?: boolean;
  disabled?: boolean;
  size?: 'default' | 'large' | 'small';
}

export const Textarea: React.FC<TextareaProps> = ({
  id,
  name,
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
  size,
}) => {
  return (
    <div className={`${styles.inputGroup} ${error ? styles.hasMessage : ''}`}>
      <textarea
        id={id}
        name={name}
        autoComplete={name}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        className={`${styles.textarea} ${styles.floatingInput} ${
          error ? styles.textareaError : ''
        } ${size === 'large' ? styles.textareaLarge : ''}`}
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
