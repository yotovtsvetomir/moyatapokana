"use client";

import { useState, useEffect } from "react";
import styles from "./ChooseSlideshow.module.css";

export default function ChooseSlideshow() {
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
      <section className={styles.ChooseSlideshow}>
        <div className={isMobile ? "container" : ""}>
          <h2 className={styles.title}>Изберете слайдшоу</h2>

          <div className={styles.ChooseSlideshowWrapper}>
            {/* Text Content */}
            <div className={styles.content}>
              <p className={styles.text}>
                Добавете слайдшоу, което гостите ще видят, за да направите поканата по-динамична и интересна.
              </p>

              <div className={styles.pairs}>
                <div className={styles.pair}>
                  <span className="material-symbols-outlined">check</span>
                  <p className={styles.textHighlight}>
                    Различни стилове на слайдшоу
                  </p>
                </div>
                <div className={styles.pair}>
                  <span className="material-symbols-outlined">check</span>
                  <p className={styles.textHighlight}>
                    Споделете своите снимки
                  </p>
                </div>
              </div>
            </div>

            {/* Image */}
            <div className={styles.imageWrapper}>
              <video
                src="/slideshow.mp4"
                autoPlay
                loop
                muted
                playsInline
                className={styles.image}
                controls
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
