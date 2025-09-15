"use client";

import { useState, useEffect, useRef } from "react";
import Image, { StaticImageData } from "next/image";
import { useRouter } from "next/navigation";
import Present from "@/assets/present.png";

import GameHeader from "@/components/GameHeader/GameHeader";
import GameFooter from "@/components/GameFooter/GameFooter";
import GameSuccess from "@/components/GameSuccess/GameSuccess";
import styles from "./presents.module.css";

type Balloon = {
  id: string;
  left: number;
  imgSrc: StaticImageData;
  bornAt: number;
  popped: boolean;
  bottomWhenPopped?: number;
};

const BALLOON_IMAGES = [Present];
const BALLOON_WIDTH = 130;
const BALLOON_HEIGHT = 130;
const POP_TARGET = 7;
const FLOAT_DURATION = 8000;

function getRandomLeft() {
  return Math.random() * (window.innerWidth - BALLOON_WIDTH);
}

function getRandomImg() {
  return BALLOON_IMAGES[Math.floor(Math.random() * BALLOON_IMAGES.length)];
}

export default function PresentGame() {
  const router = useRouter();
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [popped, setPopped] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  const [showSkip, setShowSkip] = useState(false);
  const [slug, setSlug] = useState("");
  const [slideshowKey, setSlideshowKey] = useState("");
  const [primaryColor, setPrimaryColor] = useState("");
  const [secondaryColor, setSecondaryColor] = useState("");

  const popSound = useRef<HTMLAudioElement>(null);
  const victorySound = useRef<HTMLAudioElement>(null);
  const progressSound = useRef<HTMLAudioElement>(null);

  const handleSuccess = () => {
    router.push(`/slideshows/${slideshowKey || "demo"}`);
  };

  useEffect(() => {
    const stored = localStorage.getItem("invitationData");
    if (stored) {
      const data = JSON.parse(stored);
      setSlug(data.slug ?? "");
      setSlideshowKey(data.slideshowKey ?? "");
      setPrimaryColor(data.primaryColor ?? "");
      setSecondaryColor(data.secondaryColor ?? "");
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

  // Spawn presents
  useEffect(() => {
    const spawn = () => {
      const id = Math.random().toString(36).slice(2);
      setBalloons((prev) => [
        ...prev,
        { id, left: getRandomLeft(), imgSrc: getRandomImg(), bornAt: Date.now(), popped: false },
      ]);
      setTimeout(() => setBalloons((prev) => prev.filter((b) => b.id !== id)), FLOAT_DURATION);
    };
    spawn();
    const interval = setInterval(spawn, 200);
    return () => clearInterval(interval);
  }, []);

  const handlePop = (id: string) => {
    popSound.current?.play();
    if (progressSound.current && popped + 1 < POP_TARGET) progressSound.current.play();

    setBalloons((prev) =>
      prev.map((b) => {
        if (b.id !== id) return b;
        const msAlive = Date.now() - b.bornAt;
        const percent = Math.min(msAlive / FLOAT_DURATION, 1);
        const start = -80;
        const end = window.innerHeight;
        return { ...b, popped: true, bottomWhenPopped: start + percent * (end - start) };
      })
    );

    setPopped((p) => {
      const newPopped = Math.min(p + 1, POP_TARGET);
      if (newPopped === POP_TARGET) {
        setTimeout(() => {
          setShowSuccess(true);
          victorySound.current?.play();
        }, 350);
      }
      return newPopped;
    });

    setTimeout(() => setBalloons((prev) => prev.filter((b) => b.id !== id)), 350);
  };

  return (
    <div className={styles.wrapper}>
      <Image src="/bgr.webp" alt="Background" fill style={{ objectFit: "cover", position: "absolute", top: 0, left: 0, zIndex: 0 }} priority />
      <audio ref={popSound} src="/present.wav" preload="auto" />
      <audio ref={victorySound} src="/tada.wav" preload="auto" />
      <audio ref={progressSound} src="/blip.wav" preload="auto" />

      <GameHeader title={`Отвори ${POP_TARGET} подаръка и виж изненада!`} />

      <div style={{ flex: 1, position: "relative" }}>
        {balloons.map((b) => {
          const style: React.CSSProperties = {
            left: b.left,
            width: BALLOON_WIDTH,
            height: BALLOON_HEIGHT,
            pointerEvents: b.popped ? "none" : "auto",
            ...(b.popped ? { bottom: b.bottomWhenPopped, animation: `${styles.pop} 0.35s cubic-bezier(0.68,-0.55,0.27,1.55) forwards` } : {}),
          };
          return (
            <div
              key={b.id}
              className={`${styles.balloon}${b.popped ? ` ${styles.popped}` : ""}`}
              style={style}
              onClick={() => !b.popped && popped < POP_TARGET && handlePop(b.id)}
            >
              <Image src={b.imgSrc} width={BALLOON_WIDTH} height={BALLOON_HEIGHT} alt="" draggable={false} style={{ pointerEvents: "none", userSelect: "none" }} priority />
            </div>
          );
        })}
      </div>

      <GameFooter
        current={popped}
        total={POP_TARGET}
        onSkip={showSkip ? handleSuccess : undefined}
        showSkip={showSkip}
      />

      {showSuccess && (
        <GameSuccess
          title="🎉 Браво! 🎉"
          message="Ти отвори всички подаръци! Ето твоята изненада!"
          onConfirm={handleSuccess}
        />
      )}
    </div>
  );
}
