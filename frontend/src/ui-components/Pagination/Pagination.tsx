'use client';

import styles from './Pagination.module.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const getPageNumbers = () => {
    const pages: (number | 'prev-ellipsis' | 'next-ellipsis')[] = [];
    const totalButtons = 7; // total buttons including ellipsis

    if (totalPages <= totalButtons) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);

    const leftSibling = Math.max(currentPage - 1, 2);
    const rightSibling = Math.min(currentPage + 1, totalPages - 1);

    if (currentPage <= 4) {
      for (let i = 2; i <= 5; i++) pages.push(i);
      pages.push('next-ellipsis');
    } else if (currentPage >= totalPages - 3) {
      pages.push('prev-ellipsis');
      for (let i = totalPages - 4; i < totalPages; i++) pages.push(i);
    } else {
      pages.push('prev-ellipsis');
      pages.push(leftSibling);
      pages.push(currentPage);
      pages.push(rightSibling);
      pages.push('next-ellipsis');
    }

    pages.push(totalPages);
    return pages;
  };

  const pageItems = getPageNumbers().map((page, index) => {
    if (page === 'prev-ellipsis') {
      return (
        <button
          key={`prev-ellipsis-${index}`}
          className={styles.pageButton}
          onClick={() => handlePageClick(Math.max(currentPage - 3, 1))}
        >
          ...
        </button>
      );
    }

    if (page === 'next-ellipsis') {
      return (
        <button
          key={`next-ellipsis-${index}`}
          className={styles.pageButton}
          onClick={() => handlePageClick(Math.min(currentPage + 3, totalPages))}
        >
          ...
        </button>
      );
    }

    return (
      <button
        key={page}
        className={`${styles.pageButton} ${page === currentPage ? styles.active : ''}`}
        onClick={() => handlePageClick(Number(page))}
      >
        {page}
      </button>
    );
  });

  return (
    <div className={styles.pagination}>
      <button
        onClick={() => handlePageClick(currentPage - 1)}
        disabled={currentPage === 1}
        className={styles.navButton}
      >
        <span className="material-symbols-outlined">chevron_left</span>
      </button>

      {pageItems}

      <button
        onClick={() => handlePageClick(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={styles.navButton}
      >
        <span className="material-symbols-outlined">chevron_right</span>
      </button>
    </div>
  );
}
