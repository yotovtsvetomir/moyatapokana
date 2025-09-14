"use client";

import { useState, useEffect } from "react";
import { Template } from "@/shared/types";
import { Carousel } from "@/ui-components/Carousel/Carousel";
import { Button } from "@/ui-components/Button/Button";
import Image from "next/image";
import styles from "./intro.module.css";

interface IntroProps {
  templates: Template[];
}

// ----------------------
// Slide component
// ----------------------
function TemplateSlide({ template }: { template: Template }) {
  const fontFamily = template.font_obj?.font_family ?? "sans-serif";

  return (
    <div className={styles.templateItemWallpaper}>
      <div className={styles.templateText} style={{ color: template.primary_color, fontFamily }}>
        <div className={styles.templateTitle}>
          <h3>{template.title}</h3>
        </div>
        <div className={styles.templateDescription}>
          {template.description
            ?.split("\n")
            .filter(p => p.trim())
            .slice(0, 2)
            .map((p, i) => (
              <p key={i}>{p.length > 115 ? p.slice(0, 115) + "…" : p}</p>
            ))}
          {template.description?.split("\n").filter(p => p.trim()).length > 2 && <p>...</p>}
        </div>
      </div>

      <Image
        src={template.wallpaper}
        alt="Преглед на поканата"
        fill
        unoptimized
        className={styles.thumbnail}
        style={{ borderRadius: 0 }}
      />

      <div style={{ position: "absolute", bottom: "1rem", left: "50%", transform: "translateX(-50%)", width: "90%" }}>
        <Button
          variant="primary"
          size="small"
          width="100%"
          icon="visibility"
          iconPosition="right"
          href={`/template/preview/${template.slug}`}
        >
          Визуализирай
        </Button>
      </div>
    </div>
  );
}

// ----------------------
// Intro component
// ----------------------
export default function Intro({ templates }: IntroProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!templates || templates.length === 0) return <p>No templates available</p>;

  return (
    <div className="container">
      <div className={styles.intro}>
        <Carousel
          items={templates}
          interval={5000}
          autoPlay
          renderItem={(template: Template) => <TemplateSlide key={template.id} template={template} />}
        />

        <div className={styles.introWrapper}>
          <div className={styles.introContent}>
            <h1>Покани, които впечатляват.</h1>
            <p>Избери шаблон, който ти харесва, персонализирай по свой вкус и сподели със своите близки.</p>
          </div>

          <div className={styles.carouselFooter}>
            <Button href="/templates" variant="secondary" size={isMobile ? "small" : "large"}>
              Разгледай
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
