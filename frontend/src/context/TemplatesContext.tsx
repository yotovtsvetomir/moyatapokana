"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import type { TemplatesApiResponse, Template, CategoryWithSubs } from "./types";

interface TemplatesContextType {
  templates: Template[];
  loading: boolean;
  setLoading: (loading: boolean) => void;
  error: string | null;
  searchTerm: string;
  inputSearchValue: string;
  setInputSearchValue: (value: string) => void;
  category: string | null;
  setCategory: (value: string | null) => void;
  subcategory: string | null;
  setSubcategory: (value: string | null) => void;
  variant: string | null;
  setVariant: (value: string | null) => void;
  categories: CategoryWithSubs[];
  subcategoryOptions: { value: string; label: string }[];
  variantOptions: { value: string; label: string }[];
  page: number;
  hasMore: boolean;
  loadMore: () => void;
  fetchTemplates: (append?: boolean) => void;
}

interface ProviderProps {
  children: ReactNode;
  initialData: TemplatesApiResponse;
  initialSearch?: string;
  initialCategories: CategoryWithSubs[];
  initialCategory?: string | null;
  initialSubcategory?: string | null;
  initialVariant?: string | null;
}

const TemplatesContext = createContext<TemplatesContextType | undefined>(undefined);

export function TemplatesProvider({
  children,
  initialData,
  initialSearch = "",
  initialCategories,
  initialCategory = null,
  initialSubcategory = null,
  initialVariant = null,
}: ProviderProps) {
  const [templates, setTemplates] = useState<Template[]>(initialData.templates.items);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialData.templates.current_page < initialData.templates.total_pages);

  const [inputSearchValue, setInputSearchValue] = useState(initialSearch);
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  const [categories] = useState<CategoryWithSubs[]>(initialCategories);
  const [category, setCategory] = useState<string | null>(initialCategory);
  const [subcategory, setSubcategory] = useState<string | null>(initialSubcategory);
  const [variant, setVariant] = useState<string | null>(initialVariant);

  const [subcategoryOptions, setSubcategoryOptions] = useState<{ value: string; label: string }[]>([{ value: "", label: "Първо изберете категория" }]);
  const [variantOptions, setVariantOptions] = useState<{ value: string; label: string }[]>([{ value: "", label: "Без" }]);

  // ✅ hydration flag: skip first client fetch to preserve server-rendered data
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const fetchTemplates = useCallback(async (append = false) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: "7",
        ordering: "-created_at",
      });
      if (searchTerm) params.append("search", searchTerm);
      if (category) params.append("category", category);
      if (subcategory) params.append("subcategory", subcategory);
      if (variant) params.append("variant", variant);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invitations/templates/list/view?${params.toString()}`);
      const data: TemplatesApiResponse = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch templates");

      setTemplates(prev => (append ? [...prev, ...data.templates.items] : data.templates.items));
      setHasMore(data.templates.current_page < data.templates.total_pages);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, category, subcategory, variant]);

  const loadMore = () => setPage(prev => prev + 1);

  // Debounced search term update
  useEffect(() => {
    const timeout = setTimeout(() => setSearchTerm(inputSearchValue), 500);
    return () => clearTimeout(timeout);
  }, [inputSearchValue]);

  // Refetch when filters/search change (skip initial hydration)
  useEffect(() => {
    if (!hydrated) return;
    setPage(1);
    fetchTemplates(false);
  }, [searchTerm, category, subcategory, variant, hydrated]);

  // Fetch more when page changes
  useEffect(() => {
    if (!hydrated) return;
    if (page > 1) fetchTemplates(true);
  }, [page, hydrated]);

  // Cascading selects: subcategories & variants
  useEffect(() => {
    const selectedCat = categories.find(c => c.slug === category);
    setSubcategoryOptions([
      { value: "", label: "Без" },
      ...(selectedCat?.subcategories.map(s => ({ value: s.slug, label: s.name })) || []),
    ]);
    setVariant(null);
    setVariantOptions([{ value: "", label: "Без" }]);
  }, [category]);

  useEffect(() => {
    const selectedCat = categories.find(c => c.slug === category);
    const selectedSub = selectedCat?.subcategories.find(s => s.slug === subcategory);
    setVariantOptions([
      { value: "", label: "Без" },
      ...(selectedSub?.variants.map(v => ({ value: v.slug, label: v.name })) || []),
    ]);
  }, [subcategory, category]);

  return (
    <TemplatesContext.Provider
      value={{
        templates,
        loading,
        setLoading,
        error,
        searchTerm,
        inputSearchValue,
        setInputSearchValue,
        category,
        setCategory,
        subcategory,
        setSubcategory,
        variant,
        setVariant,
        categories,
        subcategoryOptions,
        variantOptions,
        page,
        hasMore,
        loadMore,
        fetchTemplates,
      }}
    >
      {children}
    </TemplatesContext.Provider>
  );
}

export function useTemplates() {
  const context = useContext(TemplatesContext);
  if (!context) throw new Error("useTemplates must be used within TemplatesProvider");
  return context;
}
