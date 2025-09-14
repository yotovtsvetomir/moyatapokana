"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Button } from "@/ui-components/Button/Button";
import styles from "./ctapricing.module.css";

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
            <h2>Вижте нашите цени</h2>

            <div className={styles.CTAActions}>
              <Button
                variant="primary"
                size={isMobile ? "small" : "large"}
                onClick={() => router.push("/pricing")}
                icon="payments"
                iconPosition="left"
              >
                Към цените
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
