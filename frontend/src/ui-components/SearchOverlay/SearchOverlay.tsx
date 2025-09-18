'use client';

import { useEffect, useRef, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useClickOutside } from "@/hooks/useClickOutside";
import styles from "./SearchOverlay.module.css";

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
  headerRef: React.RefObject<HTMLElement | null>;
}

export default function SearchOverlay({ open, onClose, headerRef }: SearchOverlayProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useClickOutside([overlayRef, headerRef], () => {
    onClose();
  });

  useEffect(() => {
    if (!open) {
      setSearchTerm("");
    } else {
      inputRef.current?.focus();
    }
  }, [open]);

  const exampleSearches = ["Рожден ден", "Сватба", "Юбилей", "Кръщене", "Фирмено парти"];

  const handleSearchSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!searchTerm.trim()) return;
    router.push(`/шаблони/?търсене=${encodeURIComponent(searchTerm.trim())}`);
    onClose();
  };

  if (!open) return null;

  return (
    <div ref={overlayRef} className={styles.searchOverlay}>
      {/* Search Header */}
      <div className={styles.searchHeader}>
        <div className={styles.searchHeaderInner}>
          <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
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
              {!searchTerm && <p className={styles.placeholder}>Търси покана...</p>}
            </div>
          </form>
          <button
            className={styles.searchButton}
            onClick={() => {
              setSearchTerm("");
              onClose();
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "1.8rem" }}>
              close
            </span>
          </button>
        </div>
      </div>

      {/* Example Searches */}
      <div className={styles.exampleSearches}>
        <div className={styles.exampleSearchesInner}>
          <div className={styles.examples}>
            {exampleSearches.map((term) => (
              <div
                key={term}
                className={styles.example}
                onClick={() => {
                  setSearchTerm(term);
                  router.push(`/шаблони/?търсене=${encodeURIComponent(term)}`);
                  onClose();
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "1.4rem" }}>search</span>
                <p>{term}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
