"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Something from '@/assets/organize.png';
import styles from "./GuestTracking.module.css";

export default function GuestTracking() {
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
      <section className={styles.GuestTracking}>
        <div className={isMobile ? "container" : ""}>
          <h2 className={styles.title}>Лесно организиране</h2>

          <div className={styles.GuestTrackingWrapper}>
            {/* Text Content */}
            <div className={styles.content}>
              <p className={styles.text}>
                Виждате кои гости ще присъстват и кои няма да дойдат. Ако сте избрали меню, ще знаете предпочитанията им – риба, вегетарианско, месо или детско.
              </p>

              <div className={styles.pairs}>
                <div className={styles.pair}>
                  <span className="material-symbols-outlined">check</span>
                  <p className={styles.textHighlight}>
                   Броя на потвърдените гости.
                  </p>
                </div>
                <div className={styles.pair}>
                  <span className="material-symbols-outlined">check</span>
                  <p className={styles.textHighlight}>
                    Броя на възрастни и деца.
                  </p>
                </div>
                <div className={styles.pair}>
                  <span className="material-symbols-outlined">check</span>
                  <p className={styles.textHighlight}>
                    Броя на менютата
                  </p>
                </div>
              </div>
            </div>

            {/* Image */}
            <div className={styles.imageWrapper}>
              <Image
                unoptimized
                src={Something}
                alt="Проследяване на гостите"
                className={styles.image}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
