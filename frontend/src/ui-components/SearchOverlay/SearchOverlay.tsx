'use client';

import { useEffect, useRef, useState } from "react";
import { useClickOutside } from "@/hooks/useClickOutside";
import SearchHeader from "./SearchHeader";
import SearchResultsBox from "./SearchResultsBox";

export default function SearchOverlay({ 
  open,
  onClose,
  headerRef,
}: { 
  open: boolean;
  onClose: () => void;
  headerRef: React.RefObject<HTMLElement | null>;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState({
    results: [],
    suggested_categories: [],
    suggested_subcategories: [],
  });

  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);

  useClickOutside([overlayRef, headerRef], () => {
    onClose();
  });

  useEffect(() => {
    if (!open) {
      setSearchTerm("");
      setSearchResults({
        results: [],
        suggested_categories: [],
        suggested_subcategories: [],
      });
    }
  }, [open]);

  useEffect(() => {
    if (searchTerm.length < 2) {
      setSearchResults({ results: [], suggested_categories: [], suggested_subcategories: [] });
      return;
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/invitations/templates/search/?q=${encodeURIComponent(searchTerm)}`
        );
        const data = await res.json();
        setSearchResults({
          results: data.results || [],
          suggested_categories: data.suggested_categories || [],
          suggested_subcategories: data.suggested_subcategories || [],
        });
      } catch (err) {
        console.error("Search failed:", err);
        setSearchResults({ results: [], suggested_categories: [], suggested_subcategories: [] });
      }
    }, 500);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchTerm]);

  const handleSearchSubmit = async () => {
    if (!searchTerm.trim()) return;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invitations/templates/search/?q=${encodeURIComponent(searchTerm)}`);
    const data = await res.json();
    setSearchResults({
      results: data.results || [],
      suggested_categories: data.suggested_categories || [],
      suggested_subcategories: data.suggested_subcategories || [],
    });
  };

  if (!open) return null;

  return (
    <div ref={overlayRef}>
      <SearchHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onSubmit={handleSearchSubmit}
        onClose={() => {
          setSearchTerm("");
          setSearchResults({ results: [], suggested_categories: [], suggested_subcategories: [] });
          onClose();
        }}
      />
      {(searchTerm || searchResults.results.length > 0) && (
        <SearchResultsBox
          searchResults={searchResults}
          onClose={() => setSearchResults({ results: [], suggested_categories: [], suggested_subcategories: [] })}
          clearSearch={() => setSearchTerm("")}
        />
      )}
    </div>
  );
}
