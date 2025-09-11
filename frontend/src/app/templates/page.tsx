'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useSearchParams } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from '@/ui-components/Input/Input';
import { Spinner } from '@/ui-components/Spinner/Spinner';
import styles from './templates.module.css';
import type { components } from '@/shared/types';
import ReactSelect, { Option } from '@/ui-components/Select/ReactSelect';
import { Button } from "@/ui-components/Button/Button";
import { useDynamicFont } from "@/hooks/useDynamicFont";

type Template = components['schemas']['TemplateRead'];

interface SubCategoryWithVariants {
  id: number;
  name: string;
  variants: { id: number; name: string }[];
}

interface CategoryWithSubs {
  id: number;
  name: string;
  subcategories: SubCategoryWithVariants[];
}

interface TemplatesApiResponse {
  templates: {
    items: Template[];
    total_pages: number;
    current_page: number;
    total_count: number;
  };
  filters: {
    categories: CategoryWithSubs[];
  };
  error?: string;
}

function TemplateItem({ template }: { template: Template }) {
  const fontFamily = useDynamicFont(template.font_obj);

  return (
    <li className={styles.templateItem}>
      <div className={styles.templateItemWallpaper}>
        <div
          className={styles.templateText}
          style={{ color: template.primary_color, fontFamily }}
        >
          <div className={styles.templateTitle}>
            <h3>{template.title}</h3>
          </div>

          <div className={styles.templateDescription}>
            {template.description &&
              template.description
                .split("\n")
                .filter((p) => p.trim())
                .map((p, i) => <p key={i}>{p}</p>)}
          </div>
        </div>
        <Image
          src={template.wallpaper}
          alt="Преглед на поканата"
          fill
          unoptimized
          className={styles.thumbnail}
        />
      </div>

      <div className={styles.templateItemContent}>
        {[
          { label: 'Категория', value: template.category?.name ?? 'Без' },
          { label: 'Подкатегория', value: template.subcategory?.name ?? 'Без' },
          { label: 'Пол', value: template.subcategory_variant?.name ?? 'Без' },
          { label: 'Игра', value: template.selected_game_obj?.name ?? 'Без' },
          { label: 'Слайдшоу', value: template.selected_slideshow_obj?.name ?? 'Без' },
          { label: 'Шрифт', value: template.font_obj?.label ?? 'Без' },
          {
            label: 'Тема',
            value: `${template.primary_color ?? '#ccc'} ${template.secondary_color ?? '#ccc'}`,
            isColor: true,
          },
        ].map((item) => (
          <div key={item.label} className={styles.infoPair}>
            <h5>{item.label}</h5>
            {item.isColor ? (
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {item.value.split(' ').map((color, idx) => (
                  <span
                    key={idx}
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      backgroundColor: color,
                    }}
                  />
                ))}
              </div>
            ) : (
              <p>{item.value}</p>
            )}
          </div>
        ))}
      </div>

      <div className={styles.actions}>
        <Button
          variant="primary"
          size="middle"
          width="100%"
          icon="visibility"
          iconPosition="right"
          href={`/templates/preview/${template.slug}`}
        >
          Визуализирай
        </Button>
      </div>
    </li>
  );
}

export default function TemplatesPage() {
  const searchParams = useSearchParams();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [categories, setCategories] = useState<CategoryWithSubs[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<Option[]>([]);
  const [subcategoryOptions, setSubcategoryOptions] = useState<Option[]>([]);
  const [variantOptions, setVariantOptions] = useState<Option[]>([]);

  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [subcategoryId, setSubcategoryId] = useState<number | null>(null);
  const [variantId, setVariantId] = useState<number | null>(null);

  const [inputSearchValue, setInputSearchValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedInput = useDebounce(inputSearchValue, 700);

  const fetchTemplates = useCallback(async (append = false) => {
    if (loading) return;
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        page_size: '7',
        ordering: '-created_at',
      });
      if (searchTerm.trim()) params.append('search', searchTerm.trim());
      if (categoryId !== null) params.append('category_id', categoryId.toString());
      if (subcategoryId !== null) params.append('subcategory_id', subcategoryId.toString());
      if (variantId !== null) params.append('subcategory_variant_id', variantId.toString());

      const res = await fetch(`/api/invitations/templates/?${params.toString()}`);
      const data: TemplatesApiResponse = await res.json();
      if (!res.ok) throw new Error(data.error || 'Грешка при зареждане на шаблони');

      setTemplates(prev =>
        append ? [...prev, ...data.templates.items] : data.templates.items
      );
      setHasMore(data.templates.current_page < data.templates.total_pages);

      // Only populate categories once
      if (!append && data.filters.categories) {
        setCategories(data.filters.categories);
        setCategoryOptions([
          { value: '', label: 'Без' },
          ...data.filters.categories.map(c => ({ value: c.id.toString(), label: c.name })),
        ]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Възникна грешка');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, categoryId, subcategoryId, variantId, loading]);

  // Handle cascading selects
  const handleCategoryChange = (option: Option | null) => {
    const newCatId = option && option.value !== '' ? parseInt(option.value, 10) : null;
    setCategoryId(newCatId);
    setSubcategoryId(null);
    setVariantId(null);

    if (newCatId) {
      const selectedCat = categories.find(c => c.id === newCatId);
      setSubcategoryOptions([
        { value: '', label: 'Без' },
        ...(selectedCat?.subcategories.map(s => ({ value: s.id.toString(), label: s.name })) || [])
      ]);
      setVariantOptions([{ value: '', label: 'Без' }]);
    } else {
      setSubcategoryOptions([{ value: '', label: 'Първо изберете категория' }]);
      setVariantOptions([{ value: '', label: 'Без' }]);
    }
  };

  const handleSubcategoryChange = (option: Option | null) => {
    const newSubId = option && option.value !== '' ? parseInt(option.value, 10) : null;
    setSubcategoryId(newSubId);
    setVariantId(null);

    if (newSubId && categoryId !== null) {
      const selectedCat = categories.find(c => c.id === categoryId);
      const selectedSub = selectedCat?.subcategories.find(s => s.id === newSubId);
      setVariantOptions([
        { value: '', label: 'Без' },
        ...(selectedSub?.variants.map(v => ({ value: v.id.toString(), label: v.name })) || [])
      ]);
    } else {
      setVariantOptions([{ value: '', label: 'Без' }]);
    }
  };

  const handleVariantChange = (option: Option | null) => {
    const newVariantId = option && option.value !== '' ? parseInt(option.value, 10) : null;
    setVariantId(newVariantId);
  };

  useEffect(() => {
    const param = searchParams.get("search") || '';
    setInputSearchValue(param);
  }, [searchParams]);

  useEffect(() => {
    setSearchTerm(debouncedInput);
  }, [debouncedInput]);

  useEffect(() => {
    setPage(1);
    fetchTemplates(false);
  }, [searchTerm, categoryId, subcategoryId, variantId]);

  useEffect(() => {
    if (page > 1) fetchTemplates(true);
  }, [page]);

  // Infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 300 &&
        hasMore &&
        !loading
      ) {
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
          value={
            categoryId ? { value: categoryId.toString(), label: categoryOptions.find(o => o.value === categoryId.toString())?.label || '' } : { value: '', label: 'Изберете категория' }
          }
          onChange={handleCategoryChange}
        />

        <ReactSelect
          options={subcategoryOptions}
          value={
            subcategoryId ? { value: subcategoryId.toString(), label: subcategoryOptions.find(o => o.value === subcategoryId.toString())?.label || '' } : { value: '', label: categoryId ? 'Изберете подкатегория' : 'Първо изберете категория' }
          }
          onChange={handleSubcategoryChange}
          isDisabled={!categoryId}
        />

        <ReactSelect
          options={variantOptions}
          value={
            variantId ? { value: variantId.toString(), label: variantOptions.find(o => o.value === variantId.toString())?.label || '' } : { value: '', label: subcategoryId ? 'Изберете вариант' : 'Първо изберете подкатегория' }
          }
          onChange={handleVariantChange}
          isDisabled={!subcategoryId}
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <ul className={styles.templateList}>
        {templates.map(template => (
          <TemplateItem key={template.id} template={template} />
        ))}
      </ul>

      {loading && <Spinner />}
      {!hasMore && <p className={styles.scrollEnd}>Няма повече резултати</p>}
    </div>
  );
}
