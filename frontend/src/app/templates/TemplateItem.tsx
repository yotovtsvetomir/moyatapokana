import { useState, useEffect } from 'react';
import { useDynamicFont } from "@/hooks/useDynamicFont";
import Image from 'next/image';
import { Button } from "@/ui-components/Button/Button";
import styles from './templates.module.css'

export default function TemplateItem({ template, priority, isMobile }: { template: Template }) {
  const fontFamily = template.font_obj?.font_family ?? "sans-serif";

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
          priority={priority}
        />
      </div>

      <div className={styles.templateItemContent}>
        {[
          { label: 'Категория', value: template.category?.name ?? 'Без' },
          { label: 'Подкатегория', value: template.subcategory?.name ?? 'Без' },
          { label: 'Вариянт', value: template.subcategory_variant?.name ?? 'Без' },
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
          size={isMobile ? "small" : "middle"}
          width="100%"
          icon="visibility"
          iconPosition="right"
          href={`/template/preview/${template.slug}`}
        >
          Визуализирай
        </Button>
      </div>
    </li>
  );
}
