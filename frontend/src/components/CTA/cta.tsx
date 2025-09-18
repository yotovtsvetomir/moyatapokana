"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Button } from "@/ui-components/Button/Button";
import styles from "./cta.module.css";

export default function CTA() {
  const router = useRouter()
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={isMobile ? "" : "container"}>
      <section className={styles.CTA}>
        <div className={isMobile ? "container" : ""}>
          <div className={styles.CTAWrapper}>
            <h2>Създайте чернова или направете такава от шаблон.</h2>

            <div className={styles.pairs}>
              <div className={styles.pair}>
                <span className="material-symbols-outlined">edit</span>
                <p className={styles.textHighlight}>
                 Редакция на вашата покана
                </p>
              </div>

              <div className={styles.pair}>
                <span className="material-symbols-outlined">visibility</span>
                <p className={styles.textHighlight}>
                 Цялостна визуализация
                </p>
              </div>

              <div className={styles.pair}>
                <span className="material-symbols-outlined">no_accounts</span>
                <p className={styles.textHighlight}>
                 Без регистрация, безплатно
                </p>
              </div>
            </div>

            <div className={styles.CTAActions}>
              <Button
                variant="secondary"
                size={isMobile ? "small" : "large"}
                onClick={() => router.push("/шаблони")}
                icon="format_list_bulleted"
                iconPosition="left"
              >
                Разгледай шаблони
              </Button>

              <Button
                variant="primary"
                size={isMobile ? "small" : "large"}
                onClick={() => router.push("/покани/създай")}
                icon="drafts"
                iconPosition="left"
              >
                Създай покана
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
