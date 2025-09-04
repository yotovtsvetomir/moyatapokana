"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import Yellow from "@/assets/yellow.png";
import Red from "@/assets/red.png";
import Blue from "@/assets/blue.png";
import Green from "@/assets/green.png";
import styles from "./balloons.module.css";

const BALLOON_IMAGES = [Yellow, Red, Blue, Green];
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

export default function BalloonGame() {
  const router = useRouter();
  const [balloons, setBalloons] = useState([]);
  const [popped, setPopped] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [animateScore, setAnimateScore] = useState(false);
  const [showButton, setShowButton] = useState(false);

  const popSound = useRef<HTMLAudioElement>(null);
  const victorySound = useRef<HTMLAudioElement>(null);
  const progressSound = useRef<HTMLAudioElement>(null);

  const [invitationId, setInvitationId] = useState("");
  const [slideshowKey, setSlideshowKey] = useState("");
  const [primaryColor, setPrimaryColor] = useState("");
  const [secondaryColor, setSecondaryColor] = useState("");

  const handleSuccess = () => {
    if (slideshowKey) {
      router.push(
        `/slideshows/${slideshowKey}`
      );
    } else {
      setShowSuccess(false);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("invitationData");
    if (stored) {
      const data = JSON.parse(stored);
      setInvitationId(data.invitationId ?? "");
      setSlideshowKey(data.slideshowKey ?? "");
      setPrimaryColor(data.primaryColor ?? "");
      setSecondaryColor(data.secondaryColor ?? "");
    }
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--invitation-primary", primaryColor);
    document.documentElement.style.setProperty("--invitation-bg-light", secondaryColor);
    document.documentElement.style.setProperty("--invitation-bg-medium", "rgba(255, 250, 240, 0.90)");
    document.documentElement.style.setProperty("--invitation-bg-dark", "#181818");
    document.documentElement.style.setProperty("--invitation-text-main", "#2C3E50");
  }, [primaryColor, secondaryColor]);

  // Animate score on pop
  useEffect(() => {
    if (popped === 0) return;
    setAnimateScore(true);
    const timeout = setTimeout(() => setAnimateScore(false), 340);
    return () => clearTimeout(timeout);
  }, [popped]);

  // Spawn balloons
  useEffect(() => {
    const spawn = () => {
      const id = Math.random().toString(36).slice(2);
      setBalloons((prev) => [
        ...prev,
        { id, left: getRandomLeft(), imgSrc: getRandomImg(), bornAt: Date.now(), popped: false, bottomWhenPopped: null },
      ]);

      setTimeout(() => setBalloons((prev) => prev.filter((b) => b.id !== id)), FLOAT_DURATION);
    };

    spawn();
    const interval = setInterval(spawn, 1200);

    return () => clearInterval(interval);
  }, []);

  const handlePop = (id: string) => {
    if (popSound.current) { popSound.current.currentTime = 0; popSound.current.play(); }
    if (progressSound.current && popped + 1 < POP_TARGET) { progressSound.current.currentTime = 0; progressSound.current.play(); }

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
          if (victorySound.current) { victorySound.current.currentTime = 0; victorySound.current.play(); }
        }, 350);
      }
      return newPopped;
    });

    setTimeout(() => setBalloons((prev) => prev.filter((b) => b.id !== id)), 350);
  };

  return (
    <div style={{ width: "100vw", height: "100dvh", overflow: "hidden", position: "relative", display: "flex", flexDirection: "column", maxWidth: 1200, margin: "0 auto" }}>
      <Image src="/bgr.webp" alt="Background" fill style={{ objectFit: "cover", position: "absolute", top: 0, left: 0, zIndex: 0 }} priority />

      <audio ref={popSound} src="/pop.wav" preload="auto" />
      <audio ref={victorySound} src="/tada.wav" preload="auto" />
      <audio ref={progressSound} src="/blip.wav" preload="auto" />

      <div className={styles.headingBanner}>
        <h1 className={styles.heading}>Спукай {POP_TARGET} балона и виж изненада!</h1>
      </div>

      <div style={{ flex: 1, position: "relative" }}>
        {balloons.map((b) => {
          const style = { left: b.left, width: BALLOON_WIDTH, height: BALLOON_HEIGHT, pointerEvents: b.popped ? "none" : "auto", ...(b.popped ? { bottom: b.bottomWhenPopped, animation: `${styles.pop} 0.35s cubic-bezier(0.68,-0.55,0.27,1.55) forwards` } : {}) };
          return (
            <div key={b.id} className={`${styles.balloon}${b.popped ? ` ${styles.popped}` : ""}`} style={style} onClick={() => !b.popped && popped < POP_TARGET && handlePop(b.id)}>
              <Image src={b.imgSrc} width={BALLOON_WIDTH} height={BALLOON_HEIGHT} alt="" draggable={false} style={{ pointerEvents: "none", userSelect: "none" }} priority />
            </div>
          );
        })}
      </div>

      {showSuccess && (
        <div className={styles.successOverlay}>
          <div className={styles.successBox}>
            <h2>🎉 Браво! 🎉</h2>
            <p>Ти спука всички балони! Ето твоята изненада:</p>
            <button onClick={handleSuccess}>Виж изненада</button>
          </div>
        </div>
      )}

      <div className={styles.progressBarFooter}>
        <div className={styles.progressBarWrapper}>
          <div className={styles.progressBarBG}></div>
          <div className={styles.progressBarFill} style={{ width: `${Math.min(popped / POP_TARGET, 1) * 100}%` }}></div>
          <div className={styles.progressBarText}>
            <span className={`${styles.currentNum} ${animateScore ? styles.popAnim : ""}`}>{popped}</span>
            <span className={styles.slash}>/</span>
            <span className={styles.totalNum}>{POP_TARGET}</span>
          </div>
        </div>

        {!false && <button type="button" onClick={handleSuccess}>Пропусни</button>}
      </div>
    </div>
  );
}
