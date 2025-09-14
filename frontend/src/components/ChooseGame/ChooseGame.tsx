"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import GameImage from '@/assets/balloonsPresentation.png';
import styles from "./ChooseGame.module.css";

export default function ChooseGame() {
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
      <section className={styles.ChooseGame}>
        <div className={isMobile ? "container" : ""}>
          <h2 className={styles.title}>Изберете игра</h2>

          <div className={styles.ChooseGameWrapper}>
            {/* Text Content */}
            <div className={styles.content}>
              <p className={styles.text}>
                Направете поканата още по-забавна като добавите игра, която гостите ще трябва да спечелят преди да видят изненадата.
              </p>

              <div className={styles.pairs}>
                <div className={styles.pair}>
                  <span className="material-symbols-outlined">check</span>
                  <p className={styles.textHighlight}>
                    Избор от различни игри
                  </p>
                </div>
              </div>
            </div>

            {/* Image */}
            <div className={styles.imageWrapper}>
              <Image
                src={GameImage}
                alt="Избор на игра"
                className={styles.image}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
