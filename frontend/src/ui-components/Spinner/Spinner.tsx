import React from 'react';
import { ClipLoader } from 'react-spinners';
import styles from './Spinner.module.css'

interface SpinnerProps {
  size?: number;
  color?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 40,
  color = 'var(--color-highlight-1)',
}) => {
  return (
    <div className={styles.center}>
      <ClipLoader size={size} color={color} />
    </div>
  );
};
