import React from 'react';
import styles from './Blob.module.css';

interface BlobProps {
  label: string;
  prefix?: string;
  onClick?: () => void;
  count?: number;
}

const Blob: React.FC<BlobProps> = ({ label, prefix, onClick, count }) => {
  return (
    <button className={styles.blob} onClick={onClick}>
      {prefix && <span className={styles.prefix}>{prefix}</span>}
      <span>{label}</span>
      {typeof count === 'number' && <span className={styles.count}>({count})</span>}
    </button>
  );
};

export default Blob;
