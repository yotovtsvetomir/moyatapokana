import React, { useRef } from 'react';
import styles from './RadioButton.module.css';

type RadioButtonProps = {
  label: string;
  name: string;
  value: string;
  selected: boolean;
  onSelect: (value: string) => void;
  color?: string; // <-- new optional color prop
  disabled?: boolean;
};

const RadioButton: React.FC<RadioButtonProps> = ({
  label,
  name,
  value,
  selected,
  onSelect,
  color = 'var(--color-highlight-1)',
  disabled = false,
}) => {
  const circleWrapperRef = useRef<HTMLSpanElement>(null);

  const handleClick = () => {
    if (disabled) return;

    const wrapper = circleWrapperRef.current;
    if (!wrapper) return;

    const ripple = document.createElement('span');
    ripple.className = styles.ripple;
    ripple.style.backgroundColor = color;

    wrapper.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);

    onSelect(value);
  };

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      name={name}
      disabled={disabled}
      onClick={handleClick}
      className={`${styles.radioButton} ${selected ? styles.selected : ''} ${
        disabled ? styles.disabled : ''
      }`}
      style={{ '--radio-highlight-color': color } as React.CSSProperties}
    >
      <span className={styles.circleWrapper} ref={circleWrapperRef}>
        <span className={styles.circleClipper}>
          <span className={styles.rippleLayer} />
          <span className={`${styles.borderCircle} ${selected ? styles.selected : ''}`}>
            <span className={`${styles.dot} ${selected ? styles.visible : ''}`} />
          </span>
        </span>
      </span>
      <span className={styles.label}>{label}</span>
    </button>
  );
};

export default RadioButton;
