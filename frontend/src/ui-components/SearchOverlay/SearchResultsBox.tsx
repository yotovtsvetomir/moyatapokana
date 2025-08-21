'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './SearchResultsBox.module.css';
import Blob from '@/ui-components/Blob/Blob';

interface SearchResult {
  id: string;
  name: string;
  wallpaper?: string;
}

interface Category {
  id: number;
  name: string;
  count?: number;
}

interface Subcategory {
  id: number;
  name: string;
  count?: number;
  category: number;
  category_data: {
    id: number;
    name: string;
  };
}

interface SearchResultsBoxProps {
  searchResults: {
    results: SearchResult[];
    suggested_categories?: Category[];
    suggested_subcategories?: Subcategory[];
  };
  onClose: () => void;
  clearSearch: () => void;
}

export default function SearchResultsBox({
  searchResults,
  onClose,
  clearSearch,
}: SearchResultsBoxProps) {
  const router = useRouter();
  const [isBoxVisible, setIsBoxVisible] = useState(false);

  const handleSelect = (path: string) => {
    router.push(path);
    onClose();
    clearSearch();
  };

  const hasSuggestions =
    (searchResults.suggested_categories?.length ?? 0) > 0 ||
    (searchResults.suggested_subcategories?.length ?? 0) > 0;

  const hasResults = (searchResults.results?.length ?? 0) > 0;

  useEffect(() => {
    if (hasSuggestions || hasResults) {
      setIsBoxVisible(true);
    } else {
      const timeout = setTimeout(() => setIsBoxVisible(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [hasSuggestions, hasResults]);

  return (
    <div
      className={`${styles.searchResultsBox} ${
        isBoxVisible ? styles.searchResultsBoxVisible : ''
      }`}
    >
      {(hasSuggestions || hasResults) && (
        <>
          {/* Suggestions */}
          {hasSuggestions && (
            <>
              <div className={styles.suggestedGroup}>
                <h4 className={styles.sectionTitle}>Категории</h4>
                <ul className={styles.suggestedList}>
                  {searchResults.suggested_categories?.map((cat) => (
                    <li key={`cat-${cat.id}`}>
                      <Blob
                        label={cat.name}
                        count={cat.count}
                        onClick={() =>
                          handleSelect(`/templates?category=${cat.id}`)
                        }
                      />
                    </li>
                  ))}
                  {searchResults.suggested_subcategories?.map((sub) => (
                    <li key={`sub-${sub.id}`}>
                      <Blob
                        label={sub.name}
                        prefix={`${sub.category_data.name} / `}
                        count={sub.count}
                        onClick={() =>
                          handleSelect(
                            `/templates?category=${sub.category}&subcategory=${sub.id}`
                          )
                        }
                      />
                    </li>
                  ))}
                </ul>
              </div>
              <hr className={styles.searchDividerLine} />
            </>
          )}

          {/* Results */}
          {hasResults && (
            <>
              <h4 className={styles.sectionTitle}>Шаблони</h4>
              <ul className={styles.searchResults}>
                {searchResults.results.map((item) => (
                  <li
                    key={item.id}
                    onClick={() =>
                      handleSelect(
                        `/templates?q=${encodeURIComponent(item.name)}`
                      )
                    }
                    className={styles.searchResultItem}
                  >
                    {item.wallpaper && (
                      <Image
                        src={item.wallpaper}
                        alt={item.name}
                        width={40}
                        height={40}
                        className={styles.resultImage}
                      />
                    )}
                    <p>{item.name}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}
