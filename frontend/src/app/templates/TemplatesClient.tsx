'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
  const [templates, setTemplates] = useState<Template[]>(initialData.templates.items);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialData.templates.current_page < initialData.templates.total_pages);

  const [inputSearchValue, setInputSearchValue] = useState(initialSearch);
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  // Filters state
  const [categories] = useState<CategoryWithSubs[]>(initialCategories);
  const [category, setCategory] = useState<string | null>(initialCategory ?? null);
  const [subcategory, setSubcategory] = useState<string | null>(initialSubcategory ?? null);
  const [variant, setVariant] = useState<string | null>(initialVariant ?? null);

  // Options
  const [categoryOptions] = useState<Option[]>([
    { value: '', label: 'Без' },
    ...initialCategories.map(c => ({ value: c.slug, label: c.name })),
  ]);
  const [subcategoryOptions, setSubcategoryOptions] = useState<Option[]>([{ value: '', label: 'Първо изберете категория' }]);
  const [variantOptions, setVariantOptions] = useState<Option[]>([{ value: '', label: 'Без' }]);

  // Update query params in URL
  const updateURL = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (category) params.set('category', category);
    if (subcategory) params.set('subcategory', subcategory);
    if (variant) params.set('variant', variant);
    window.history.replaceState(null, '', `?${params.toString()}`);
  };

  // Fetch templates
  const fetchTemplates = useCallback(async (append = false) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '7',
        ordering: '-created_at',
      });
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

  // Cascading selects handlers
  const handleCategoryChange = (option: Option | null) => {
    const value = option?.value || null;
    setCategory(value);
    setSubcategory(null);
    setVariant(null);

    const selectedCat = categories.find(c => c.slug === value);
    setSubcategoryOptions([
      { value: '', label: 'Без' },
      ...(selectedCat?.subcategories.map(s => ({ value: s.slug, label: s.name })) || [])
    ]);
    setVariantOptions([{ value: '', label: 'Без' }]);
  };

  const handleSubcategoryChange = (option: Option | null) => {
    const value = option?.value || null;
    setSubcategory(value);
    setVariant(null);

    const selectedCat = categories.find(c => c.slug === category);
    const selectedSub = selectedCat?.subcategories.find(s => s.slug === value);
    setVariantOptions([
      { value: '', label: 'Без' },
      ...(selectedSub?.variants.map(v => ({ value: v.slug, label: v.name })) || [])
    ]);
  };

  const handleVariantChange = (option: Option | null) => {
    setVariant(option?.value || null);
  };

  // Effects
  useEffect(() => {
    const timeout = setTimeout(() => setSearchTerm(inputSearchValue), 500);
    return () => clearTimeout(timeout);
  }, [inputSearchValue]);

  useEffect(() => {
    setPage(1);
    updateURL();
    fetchTemplates(false);
  }, [searchTerm, category, subcategory, variant]);

  useEffect(() => {
    if (page > 1) fetchTemplates(true);
  }, [page]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300 && hasMore && !loading) {
        setPage(prev => prev + 1);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading]);

  return (
    <div className="container fullHeight centerWrapper">
      <h1 className={styles.title}>Шаблони</h1>

      <div className={styles.search}>
        <Input
          id="search"
          name="search"
          label="Търсене на шаблони"
          value={inputSearchValue}
          onChange={e => setInputSearchValue(e.target.value)}
        />
      </div>

      <div className={styles.filters}>
        <ReactSelect
          options={categoryOptions}
          value={category ? categoryOptions.find(o => o.value === category) : { value: '', label: 'Изберете категория' }}
          onChange={handleCategoryChange}
        />

        <ReactSelect
          options={subcategoryOptions}
          value={subcategory ? subcategoryOptions.find(o => o.value === subcategory) : { value: '', label: category ? 'Изберете подкатегория' : 'Първо изберете категория' }}
          onChange={handleSubcategoryChange}
          isDisabled={!category}
        />

        <ReactSelect
          options={variantOptions}
          value={variant ? variantOptions.find(o => o.value === variant) : { value: '', label: subcategory ? 'Изберете вариант' : 'Първо изберете подкатегория' }}
          onChange={handleVariantChange}
          isDisabled={!subcategory}
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <ul className={styles.templateList}>
        {templates.map((template, index) => (
          <TemplateItem
            key={template.id}
            template={template}
            priority={index === 0}
          />
        ))}
      </ul>

      {loading && <Spinner />}
      {!hasMore && <p className={styles.scrollEnd}>Няма повече резултати</p>}
    </div>
  );
}
