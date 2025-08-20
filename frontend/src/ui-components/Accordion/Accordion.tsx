'use client';

import { useState, ReactNode } from 'react';
import styles from './Accordion.module.css';

interface AccordionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

const Accordion = ({ title, children, defaultOpen = false }: AccordionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={styles.accordion}>
      <button
        className={`${styles.header} ${isOpen ? styles.opened : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <span className={styles.title}>{title}</span>
        <span className={`material-symbols-outlined ${styles.icon} ${isOpen ? styles.open : ''}`}>
          expand_more
        </span>
      </button>
      <div className={`${styles.content} ${isOpen ? styles.expanded : styles.collapsed}`}>
        {children}
      </div>
    </div>
  );
};

export default Accordion;
