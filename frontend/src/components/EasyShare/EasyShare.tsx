"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./EasyShare.module.css";

export default function EasyShare() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  console.log(isMobile)

  return (
    <div className={isMobile ? "" : "container"}>
      <section className={styles.EasyShare}>
        <div className={isMobile ? "container" : ""}>
          <h2 className={styles.title}>Лесно споделяне</h2>

          <div className={styles.EasyShareWrapper}>
            <div className={styles.content}>
              <p className={styles.text}>
                Споделяте поканата само с няколко клика по Facebook, Viber или друг любим начин. Лесно и удобно.
              </p>

              <div className={styles.pairs}>
                <div className={styles.pair}>
                  <span className="material-symbols-outlined">check</span>
                  <p className={styles.textHighlight}>
                    Без надписване по 100 пъти.
                  </p>
                </div>
                <div className={styles.pair}>
                  <span className="material-symbols-outlined">check</span>
                  <p className={styles.textHighlight}>
                    Без изпращане по пощата.
                  </p>
                </div>
                <div className={styles.pair}>
                  <span className="material-symbols-outlined">check</span>
                  <p className={styles.textHighlight}>
                    Без съмнение кой е получил поканата.
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.imageWrapper}>
              <video
                src="/sharelink.mp4"
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
