'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import fireworks from '@/assets/boom_confetti.json';
import styles from './slide1.module.css';

interface SlideshowImage {
  order: number;
  file_url: string;
}

const steps = [
  [0],
  [1, 2],
  [3, 4],
  [0],
  [0, 1, 2, 3, 4],
];

const confettiSoundUrl = '/surprise.wav';

function getRandomPositions(
  num: number,
  imageSize = 140,
  padding = 32,
  reservedFooterHeight = 110,
  buffer = 12
): { x: number; y: number }[] {
  let size = imageSize;
  let positions: { x: number; y: number }[] = [];

  for (let attemptShrink = 0; attemptShrink < 4; attemptShrink++) {
    positions = [];
    let success = true;
    for (let i = 0; i < num; i++) {
      let found = false;
      for (let tries = 0; tries < 200; tries++) {
        const minX = padding + size / 2;
        const maxX = window.innerWidth - padding - size / 2;
        const minY = padding + size / 2;
        const maxY = window.innerHeight - padding - reservedFooterHeight - size / 2;
        const x = Math.random() * (maxX - minX) + minX;
        const y = Math.random() * (maxY - minY) + minY;

        const overlaps = positions.some(pos => {
          const dx = pos.x - x;
          const dy = pos.y - y;
          return Math.sqrt(dx * dx + dy * dy) < size + buffer;
        });

        if (!overlaps) {
          positions.push({ x, y });
          found = true;
          break;
        }
      }
      if (!found) {
        success = false;
        break;
      }
    }
    if (success) break;
    size = Math.max(60, size - 18);
  }

  return positions;
}

export default function SlideOne() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [primaryColor, setPrimaryColor] = useState("");
  const [secondaryColor, setSecondaryColor] = useState("");
  const [isTemplate, setIsTemplate] = useState(false);
  const [images, setImages] = useState<SlideshowImage[]>([]);
  const [step, setStep] = useState(0);
  const [positions, setPositions] = useState<{ x: number; y: number }[]>([]);
  const [imageSize, setImageSize] = useState(140);
  const [footerHeight, setFooterHeight] = useState(97);
  const [showLottie, setShowLottie] = useState(true);
  const [showSkip, setShowSkip] = useState(false);

  const animationIsDone = step === steps.length - 1;

  const audioRef = useRef<HTMLAudioElement>(null);
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const footerRef = useRef<HTMLDivElement>(null);

  const calcImageSize = () => {
    if (typeof window === "undefined") return 140;
    if (window.innerWidth >= 1200) return 300;
    if (window.innerWidth >= 768) return 200;
    return 140;
  };

  const handleContinue = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    router.push(
      isTemplate
        ? `/template/preview/${slug}/schedule`
        : `/invitations/preview/${slug}/schedule`
    );
  };

  useEffect(() => {
    const stored = localStorage.getItem("invitationData");
    if (stored) {
      const data = JSON.parse(stored);
      setSlug(data.slug ?? "");
      setImages(
        (data.slideshowImages ?? []).sort(
          (a: SlideshowImage, b: SlideshowImage) => a.order - b.order
        )
      );
      setPrimaryColor(data.primaryColor ?? "");
      setSecondaryColor(data.secondaryColor ?? "");
      setIsTemplate(data.template ?? false);
    }
  }, []);

  useEffect(() => {
    if (!slug) return;
    const seenIds = JSON.parse(localStorage.getItem("seen_invitation_slugs") || "[]");
    setShowSkip(seenIds.includes(slug));
  }, [slug]);

  useEffect(() => {
    document.documentElement.style.setProperty("--invitation-primary", primaryColor);
    document.documentElement.style.setProperty("--invitation-bg-light", secondaryColor);
    document.documentElement.style.setProperty("--invitation-bg-medium", "rgba(255, 250, 240, 0.90)");
    document.documentElement.style.setProperty("--invitation-bg-dark", "#181818");
    document.documentElement.style.setProperty("--invitation-text-main", "#2C3E50");
  }, [primaryColor, secondaryColor]);

  useEffect(() => {
    if (footerRef.current) {
      setFooterHeight(footerRef.current.offsetHeight + 10);
    }
  }, []);

  useEffect(() => {
    const updateLayout = () => {
      const newSize = calcImageSize();
      setImageSize(newSize);
      setPositions(getRandomPositions(images.length, newSize, 20, footerHeight, 8));
    };

    updateLayout();
    window.addEventListener("resize", updateLayout);
    return () => window.removeEventListener("resize", updateLayout);
  }, [footerHeight, images]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }

    if (lottieRef.current) {
      lottieRef.current.play();
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        // eslint-disable-next-line react-hooks/exhaustive-deps
        audioRef.current.currentTime = 0;
      }
    };
  }, []);

  useEffect(() => {
    if (step < steps.length - 1) {
      const timer = setTimeout(() => setStep(step + 1), 2000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  return (
    <div className={styles.slideshow}>
      {showLottie && (
        <Lottie
          lottieRef={lottieRef}
          animationData={fireworks}
          loop={false}
          autoplay={false}
          onComplete={() => setShowLottie(false)}
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            width: "120vw",
            height: "120vh",
            pointerEvents: "none",
            zIndex: 2000,
          }}
        />
      )}

      <audio ref={audioRef} src={confettiSoundUrl} />

      <AnimatePresence>
        {steps[step].map(i =>
          positions[i] ? (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                position: "absolute",
                left: positions[i].x - imageSize / 2,
                top: positions[i].y - imageSize / 2,
              }}
            >
              <Image
                src={images[i]?.file_url ?? ""}
                alt={`Slide ${i + 1}`}
                width={imageSize}
                height={imageSize}
                unoptimized
                className={styles.imageCircle}
                style={{ width: imageSize, height: imageSize }}
              />
            </motion.div>
          ) : null
        )}
      </AnimatePresence>

      <div className={styles.AniFooter} ref={footerRef}>
        <div className={styles.progressBar}>
          <motion.div
            className={styles.progress}
            initial={{ width: 0 }}
            animate={{ width: `${((step + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <button
          className={styles.continueButton}
          onClick={handleContinue}
          disabled={!animationIsDone}
        >
          Продължи
        </button>
      </div>

      {!animationIsDone && showSkip && (
        <button
          className={`${styles.continueButton} ${styles.downwards}`}
          onClick={handleContinue}
        >
          Пропусни
        </button>
      )}
    </div>
  );
}
