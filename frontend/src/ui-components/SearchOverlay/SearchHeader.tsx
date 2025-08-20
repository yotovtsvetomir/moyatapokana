'use client';

import React, { FormEvent, useRef, useEffect } from "react";
import styles from "./SearchHeader.module.css";

interface SearchHeaderProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export default function SearchHeader({
  searchTerm,
  setSearchTerm,
  onSubmit,
  onClose,
}: SearchHeaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className={styles.searchHeader}>
      <div className={styles.searchHeaderInner}>
        <form className={styles.searchForm} onSubmit={handleFormSubmit}>
          <div className={styles.inputWrapper}>
            <input
              ref={inputRef}
              type="text"
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Търси покана"
              autoCapitalize="off"
              autoCorrect="off"
            />
            {!searchTerm && (
              <p className={styles.placeholder}>Търси покана...</p>
            )}
          </div>
        </form>
        <button className={styles.searchButton} onClick={onClose}>
          <span className="material-symbols-outlined" style={{ fontSize: "1.8rem" }}>
            close
          </span>
        </button>
      </div>
    </div>
  );
}
