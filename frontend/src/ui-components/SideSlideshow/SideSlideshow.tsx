'use client';

import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useState, ReactNode } from 'react';
import styles from './SideSlideshow.module.css';

interface SideSlideshowProps {
  slides: ReactNode[];
}

export default function SideSlideshow({ slides }: SideSlideshowProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [progress, setProgress] = useState(0);

  const onScroll = useCallback(() => {
    if (!emblaApi) return;
    const index = emblaApi.selectedScrollSnap();
    const total = emblaApi.scrollSnapList().length - 1;

    const minProgress = 5;
    const maxProgress = 100 - minProgress;

    const progress = total === 0
      ? 100
      : minProgress + (index / total) * maxProgress;

    setProgress(progress);
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    onScroll();
    emblaApi.on('scroll', onScroll);
    emblaApi.on('reInit', onScroll);

    const autoplayInterval = setInterval(() => {
      emblaApi.scrollNext();
    }, 3500);

    return () => {
      clearInterval(autoplayInterval);
      emblaApi.off('scroll', onScroll);
      emblaApi.off('reInit', onScroll);
    };
  }, [emblaApi, onScroll]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.embla} ref={emblaRef}>
        <div className={styles.container}>
          {slides.map((slide, index) => (
            <div key={index} className={styles.slide}>
              <div className={styles.slideInner}>{slide}</div>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.progress}>
        <div
          className={styles.progressBar}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
