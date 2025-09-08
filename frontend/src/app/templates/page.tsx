'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useSearchParams } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from '@/ui-components/Input/Input';
import Pagination from '@/ui-components/Pagination/Pagination';
import { Spinner } from '@/ui-components/Spinner/Spinner';
import styles from './templates.module.css';
import type { components } from '@/shared/types';
import ReactSelect, { Option } from '@/ui-components/Select/ReactSelect';
import { Button } from "@/ui-components/Button/Button";
import { useDynamicFont } from "@/hooks/useDynamicFont";

type Template = components['schemas']['TemplateRead'];

interface CategoryWithSubs {
  id: number;
  name: string;
  subcategories: { id: number; name: string }[];
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
  const [totalPages, setTotalPages] = useState(1);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [subcategoryId, setSubcategoryId] = useState<number | null>(null);
  const [categories, setCategories] = useState<CategoryWithSubs[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<Option[]>([]);
  const [subcategoryOptions, setSubcategoryOptions] = useState<Option[]>([]);

  const [inputSearchValue, setInputSearchValue] = useState("");
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedInput = useDebounce(inputSearchValue, 700);

  const fetchTemplates = async () => {
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

      const res = await fetch(`/api/invitations/templates/?${params.toString()}`);
      const data: TemplatesApiResponse = await res.json();

      if (!res.ok) throw new Error(data.error || 'Грешка при зареждане на шаблони');

      // Templates
      setTemplates(data.templates.items);
      setTotalPages(data.templates.total_pages);

      // Categories
      setCategories(data.filters.categories);
      setCategoryOptions([
        { value: '', label: 'Без' }, // empty option
        ...data.filters.categories.map(c => ({ value: c.id.toString(), label: c.name })),
      ]);

      // Reset subcategory options if category changed
      if (categoryId) {
        const selectedCat = data.filters.categories.find(c => c.id === categoryId);
        setSubcategoryOptions([
          { value: '', label: 'Без' }, // empty option
          ...(selectedCat ? selectedCat.subcategories.map(s => ({ value: s.id.toString(), label: s.name })) : []),
        ]);
      } else {
        setSubcategoryOptions([{ value: '', label: 'Без' }]);
        setSubcategoryId(null);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Възникна грешка');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const param = searchParams.get("search") || "";
    setInputSearchValue(param);
  }, [searchParams]);

  useEffect(() => {
    setSearchTerm(debouncedInput);
  }, [debouncedInput]);

  useEffect(() => {
    fetchTemplates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm, categoryId, subcategoryId]);

  return (
    <div className="container fullHeight centerWrapper">
      <h1 className={styles.title}>Шаблони</h1>

      <div className={styles.search}>
        <Input
          id="search"
          name="search"
          label="Търсене на шаблони"
          value={inputSearchValue}
          onChange={(e) => setInputSearchValue(e.target.value)}
        />
      </div>

      <div className={styles.filters}>
        {/* Category Select */}
        <ReactSelect
          options={categoryOptions}
          value={
            categoryId !== null
              ? {
                  value: categoryId.toString(),
                  label: categoryOptions.find(o => o.value === categoryId.toString())?.label || '',
                }
              : { value: '', label: 'Изберете категория' } // changed placeholder
          }
          onChange={(option) => {
            const newCatId = option && option.value !== '' ? parseInt(option.value, 10) : null;
            setCategoryId(newCatId);
            setSubcategoryId(null); // reset subcategory

            if (newCatId) {
              const selectedCat = categories.find(c => c.id === newCatId);
              if (selectedCat && selectedCat.subcategories.length > 0) {
                setSubcategoryOptions([
                  { value: '', label: 'Без' },
                  ...selectedCat.subcategories.map(s => ({ value: s.id.toString(), label: s.name })),
                ]);
              } else {
                setSubcategoryOptions([{ value: '', label: 'Няма подкатегории' }]);
              }
            } else {
              setSubcategoryOptions([{ value: '', label: 'Първо изберете категория' }]);
            }
          }}
          placeholder="Изберете категория"
          isClearable={false}
        />

        {/* Subcategory Select */}
        <ReactSelect
          options={subcategoryOptions}
          value={
            subcategoryId !== null
              ? {
                  value: subcategoryId.toString(),
                  label: subcategoryOptions.find(o => o.value === subcategoryId.toString())?.label || '',
                }
              : { value: '', label: categoryId ? 'Изберете подкатегория' : 'Първо изберете категория' }
          }
          onChange={(option) =>
            setSubcategoryId(option && option.value !== '' && option.value !== 'Няма подкатегории' ? parseInt(option.value, 10) : null)
          }
          placeholder={
            !categoryId
              ? 'Първо изберете категория'
              : subcategoryOptions.length === 1 && subcategoryOptions[0].label === 'Няма подкатегории'
              ? 'Няма подкатегории'
              : 'Изберете подкатегория'
          }
          isDisabled={!categoryId || (subcategoryOptions.length === 1 && subcategoryOptions[0].label === 'Няма подкатегории')}
        />
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : (
        <>
          <ul className={styles.templateList}>
            {templates.map(template => (
              <TemplateItem key={template.id} template={template} />
            ))}
          </ul>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(p) => setPage(p)}
          />
        </>
      )}
    </div>
  );
}
