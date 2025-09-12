'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Input } from '@/ui-components/Input/Input';
import TemplateItem from './TemplateItem';
import type { TemplatesApiResponse, Template, CategoryWithSubs } from './types';
import { Spinner } from '@/ui-components/Spinner/Spinner';
import styles from './templates.module.css';
import ReactSelect, { Option } from '@/ui-components/Select/ReactSelect';

interface Props {
  initialData: TemplatesApiResponse;
  initialSearch?: string;
  initialCategories: CategoryWithSubs[];
  initialCategory?: string;
  initialSubcategory?: string;
  initialVariant?: string;
}

export default function TemplatesClient({
  initialData,
  initialSearch = '',
  initialCategories,
  initialCategory,
  initialSubcategory,
  initialVariant,
}: Props) {
  // --- Helpers ---
  const getParam = (key: string) =>
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get(key) : null;

  // --- Templates & Pagination ---
  const [templates, setTemplates] = useState<Template[]>(initialData.templates.items);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialData.templates.current_page < initialData.templates.total_pages);

  // --- Search & Filters ---
  const initialSearchValue = getParam('search') ?? initialSearch ?? '';
  const [inputSearchValue, setInputSearchValue] = useState(initialSearchValue);
  const [searchTerm, setSearchTerm] = useState(initialSearchValue);

  const [categories] = useState<CategoryWithSubs[]>(initialCategories);
  const initialCategoryValue = getParam('category') ?? initialCategory ?? null;
  const initialSubcategoryValue = getParam('subcategory') ?? initialSubcategory ?? null;
  const initialVariantValue = getParam('variant') ?? initialVariant ?? null;

  const [category, setCategory] = useState<string | null>(initialCategoryValue);
  const [subcategory, setSubcategory] = useState<string | null>(initialSubcategoryValue);
  const [variant, setVariant] = useState<string | null>(initialVariantValue);

  // --- Select Options (computed upfront to avoid state updates on mount) ---
  const [categoryOptions] = useState<Option[]>([
    { value: '', label: 'Без' },
    ...categories.map(c => ({ value: c.slug, label: c.name })),
  ]);

  const initialSubOptions = (() => {
    if (!initialCategoryValue) return [{ value: '', label: 'Първо изберете категория' }];
    const selectedCat = categories.find(c => c.slug === initialCategoryValue);
    return [
      { value: '', label: 'Без' },
      ...(selectedCat?.subcategories.map(s => ({ value: s.slug, label: s.name })) || []),
    ];
  })();

  const initialVarOptions = (() => {
    if (!initialSubcategoryValue) return [{ value: '', label: 'Без' }];
    const selectedCat = categories.find(c => c.slug === initialCategoryValue);
    const selectedSub = selectedCat?.subcategories.find(s => s.slug === initialSubcategoryValue);
    return [
      { value: '', label: 'Без' },
      ...(selectedSub?.variants.map(v => ({ value: v.slug, label: v.name })) || []),
    ];
  })();

  const [subcategoryOptions, setSubcategoryOptions] = useState<Option[]>(initialSubOptions);
  const [variantOptions, setVariantOptions] = useState<Option[]>(initialVarOptions);

  const firstMount = useRef(true);

  // --- Update URL ---
  const updateURL = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (category) params.set('category', category);
    if (subcategory) params.set('subcategory', subcategory);
    if (variant) params.set('variant', variant);
    if (params.toString() != "") {
        window.history.replaceState(null, '', `?${params.toString()}`);
      }
  };

  // --- Fetch templates ---
  const fetchTemplates = useCallback(async (append = false) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: page.toString(), page_size: '7', ordering: '-created_at' });
      if (searchTerm) params.append('search', searchTerm);
      if (category) params.append('category', category);
      if (subcategory) params.append('subcategory', subcategory);
      if (variant) params.append('variant', variant);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invitations/templates/list/view?${params.toString()}`);
      const data: TemplatesApiResponse = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch templates');

      setTemplates(prev => append ? [...prev, ...data.templates.items] : data.templates.items);
      setHasMore(data.templates.current_page < data.templates.total_pages);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, category, subcategory, variant]);

  // --- Cascading select handlers ---
  const handleCategoryChange = (option: Option | null) => {
    const value = option?.value || null;
    setCategory(value);
    setSubcategory(null);
    setVariant(null);

    const selectedCat = categories.find(c => c.slug === value);
    setSubcategoryOptions([{ value: '', label: 'Без' }, ...(selectedCat?.subcategories.map(s => ({ value: s.slug, label: s.name })) || [])]);
    setVariantOptions([{ value: '', label: 'Без' }]);
  };

  const handleSubcategoryChange = (option: Option | null) => {
    const value = option?.value || null;
    setSubcategory(value);
    setVariant(null);

    const selectedCat = categories.find(c => c.slug === category);
    const selectedSub = selectedCat?.subcategories.find(s => s.slug === value);
    setVariantOptions([{ value: '', label: 'Без' }, ...(selectedSub?.variants.map(v => ({ value: v.slug, label: v.name })) || [])]);
  };

  const handleVariantChange = (option: Option | null) => setVariant(option?.value || null);

  // --- Debounced search ---
  useEffect(() => {
    const timeout = setTimeout(() => setSearchTerm(inputSearchValue), 500);
    return () => clearTimeout(timeout);
  }, [inputSearchValue]);

  // --- Fetch on search/filter change ---
  useEffect(() => {
    if (firstMount.current) {
      firstMount.current = false;
      updateURL();
      return;
    }
    setPage(1);
    updateURL();
    fetchTemplates(false);
  }, [searchTerm, category, subcategory, variant]);

  // --- Infinite scroll ---
  useEffect(() => { if (page > 1) fetchTemplates(true); }, [page]);
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300 && hasMore && !loading) setPage(prev => prev + 1);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading]);

  return (
    <div className="container fullHeight centerWrapper">
      <h1 className={styles.title}>Шаблони</h1>

      <div className={styles.search}>
        <Input id="search" name="search" label="Търсене на шаблони" value={inputSearchValue} onChange={e => setInputSearchValue(e.target.value)} />
      </div>

      <div className={styles.filters}>
        <ReactSelect options={categoryOptions} value={category ? categoryOptions.find(o => o.value === category) : { value: '', label: 'Изберете категория' }} onChange={handleCategoryChange} />
        <ReactSelect options={subcategoryOptions} value={subcategory ? subcategoryOptions.find(o => o.value === subcategory) : { value: '', label: category ? 'Изберете подкатегория' : 'Първо изберете категория' }} onChange={handleSubcategoryChange} isDisabled={!category} />
        <ReactSelect options={variantOptions} value={variant ? variantOptions.find(o => o.value === variant) : { value: '', label: subcategory ? 'Изберете вариант' : 'Първо изберете подкатегория' }} onChange={handleVariantChange} isDisabled={!subcategory} />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <ul className={styles.templateList}>
        {templates.map((template, index) => <TemplateItem key={template.id} template={template} priority={index === 0} />)}
      </ul>

      {loading && <Spinner />}
      {!hasMore && <p className={styles.scrollEnd}>Няма повече резултати</p>}
    </div>
  );
}
