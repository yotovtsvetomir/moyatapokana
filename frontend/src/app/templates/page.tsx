'use client';

import React, { useEffect, useState } from 'react';
import { Input } from '@/ui-components/Input/Input';
import Pagination from '@/ui-components/Pagination/Pagination';
import { Spinner } from '@/ui-components/Spinner/Spinner';
import styles from './templates.module.css';
import type { components } from '@/shared/types';
import ReactSelect, { Option } from '@/ui-components/Select/ReactSelect';

type Template = components['schemas']['TemplateRead'];
type Category = components['schemas']['CategoryRead'];
type SubCategory = components['schemas']['SubCategoryRead'];

interface TemplatesApiResponse {
  templates: {
    items: Template[];
    total_pages: number;
    current_page: number;
    total_count: number;
  };
  filters: {
    categories: Category[];
    subcategories: SubCategory[];
  };
  error?: string;
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [subcategoryId, setSubcategoryId] = useState<number | null>(null);
  const [categoryOptions, setCategoryOptions] = useState<Option[]>([]);
  const [subcategoryOptions, setSubcategoryOptions] = useState<Option[]>([]);

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

      const res = await fetch(`/api/invitations/templates?${params.toString()}`);
      const data: TemplatesApiResponse = await res.json();

      if (!res.ok) throw new Error(data.error || 'Грешка при зареждане на шаблони');

      // Templates
      setTemplates(data.templates.items);
      setTotalPages(data.templates.total_pages);

      // Categories / Subcategories for selects
      setCategoryOptions(data.filters.categories.map(c => ({ value: c.id.toString(), label: c.name })));
      setSubcategoryOptions(data.filters.subcategories.map(s => ({ value: s.id.toString(), label: s.name })));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Възникна грешка');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [page, searchTerm, categoryId, subcategoryId]);

  return (
    <div className="container fullHeight centerWrapper">
      <h1 className={styles.title}>Шаблони</h1>

      <div className={styles.filters}>
        <Input
          id="search"
          name="search"
          label="Търсене на шаблони"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <ReactSelect
          options={categoryOptions}
          value={categoryId !== null ? { value: categoryId.toString(), label: categoryOptions.find(o => o.value === categoryId.toString())?.label || '' } : null}
          onChange={(option) => setCategoryId(option ? parseInt(option.value, 10) : null)}
          placeholder="Избери категория"
          isClearable={false} // required field
        />

        <ReactSelect
          options={subcategoryOptions}
          value={subcategoryId !== null ? { value: subcategoryId.toString(), label: subcategoryOptions.find(o => o.value === subcategoryId.toString())?.label || '' } : null}
          onChange={(option) => setSubcategoryId(option ? parseInt(option.value, 10) : null)}
          placeholder="Избери подкатегория"
          isClearable={false} // required field
        />
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : (
        <>
          <ul className={styles.templateList}>
            {templates.map((template) => (
              <li key={template.id} className={styles.templateItem}>
                <h3>{template.title}</h3>
                {template.category && <p>Категория: {template.category.name}</p>}
                {template.subcategory && <p>Подкатегория: {template.subcategory.name}</p>}
              </li>
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
