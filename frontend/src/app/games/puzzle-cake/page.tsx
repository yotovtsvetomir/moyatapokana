"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from 'next/image';
import GameHeader from "@/components/GameHeader/GameHeader";
import GameFooter from "@/components/GameFooter/GameFooter";
import GameSuccess from "@/components/GameSuccess/GameSuccess";
import styles from "./puzzle.module.css";

const GRID_SIZE = 3;
const TILE_COUNT = GRID_SIZE * GRID_SIZE;
const IMAGE_URL = "/torta.jpg";

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function PuzzleGame() {
  const router = useRouter();
  const [placed, setPlaced] = useState<number[]>([]);
  const [selected, setSelected] = useState<null | { index: number }>(null);
  const [won, setWon] = useState(false);

  // invitation data
  const [slug, setSlug] = useState("");
  const [slideshowKey, setSlideshowKey] = useState("");
  const [primaryColor, setPrimaryColor] = useState("");
  const [secondaryColor, setSecondaryColor] = useState("");
  const [showSkip, setShowSkip] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const moveSound = useRef<HTMLAudioElement | null>(null);
  const victorySound = useRef<HTMLAudioElement | null>(null);

  const correctCount = placed.filter((p, i) => p === i).length;

  useEffect(() => {
    const pieces = Array.from({ length: TILE_COUNT }, (_, i) => i);
    setPlaced(shuffle(pieces));
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!initialized) return;

    if (placed.every((p, i) => p === i)) {
      victorySound.current?.play();
      const timeout = setTimeout(() => {
        setWon(true);
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [placed, initialized]);

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

  // Skip button logic
  useEffect(() => {
    if (!slug) return;
    const seenIds = JSON.parse(localStorage.getItem("seen_invitation_slugs") || "[]");
    setShowSkip(seenIds.includes(slug));
  }, [slug]);

  // Apply theme
  useEffect(() => {
    document.documentElement.style.setProperty("--invitation-primary", primaryColor);
    document.documentElement.style.setProperty("--invitation-bg-light", secondaryColor);
    document.documentElement.style.setProperty("--invitation-bg-medium", "rgba(255, 250, 240, 0.90)");
    document.documentElement.style.setProperty("--invitation-bg-dark", "#181818");
    document.documentElement.style.setProperty("--invitation-text-main", "#2C3E50");
  }, [primaryColor, secondaryColor]);

  function pieceBackgroundStyle(pieceIndex: number) {
    const row = Math.floor(pieceIndex / GRID_SIZE);
    const col = pieceIndex % GRID_SIZE;
    return {
      backgroundImage: `url(${IMAGE_URL})`,
      backgroundSize: `${GRID_SIZE * 100}% ${GRID_SIZE * 100}%`,
      backgroundPosition: `${(col / (GRID_SIZE - 1)) * 100}% ${(row / (GRID_SIZE - 1)) * 100}%`,
      backgroundRepeat: "no-repeat",
    } as React.CSSProperties;
  }

  function handleTileClick(index: number) {
    if (selected === null) {
      setSelected({ index });
    } else if (selected.index !== index) {
      const newPlaced = [...placed];
      [newPlaced[selected.index], newPlaced[index]] = [newPlaced[index], newPlaced[selected.index]];
      setPlaced(newPlaced);
      moveSound.current?.play();
      setSelected(null);
    } else {
      setSelected(null);
    }
  }

  function handleDragStart(e: React.DragEvent, index: number) {
    e.dataTransfer.setData("text/plain", index.toString());
  }

  function handleDrop(e: React.DragEvent, targetIndex: number) {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData("text/plain"));
    if (sourceIndex === targetIndex) return;

    const newPlaced = [...placed];
    [newPlaced[sourceIndex], newPlaced[targetIndex]] = [newPlaced[targetIndex], newPlaced[sourceIndex]];
    setPlaced(newPlaced);
    moveSound.current?.play();
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  return (
    <div className={styles.wrapper}>
      <Image src="/bgr.webp" alt="Background" fill style={{ objectFit: "cover", position: "absolute", top: 0, left: 0, zIndex: 0 }} priority />
      <audio ref={moveSound} src="/puzzleswap.wav" preload="auto" />
      <audio ref={victorySound} src="/tada.wav" preload="auto" />

      {/* Header */}
      <GameHeader title="Нареди пъзела" />


      <div className={styles.grid}>
        {placed.map((piece, index) => {
          const isSelected = selected?.index === index;
          return (
            <div
              key={index}
              className={`${styles.slot} ${isSelected ? styles.selected : ""}`}
              onClick={() => handleTileClick(index)}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragOver={handleDragOver}
            >
              <div className={styles.piece} style={pieceBackgroundStyle(piece)} />
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <GameFooter
        current={correctCount}
        total={TILE_COUNT}
        showSkip={showSkip}
        onSkip={() => router.push(`/slideshows/${slideshowKey || "demo"}`)}
      />

      {won && (
        <GameSuccess
          title="🎉 Браво! 🎉"
          message="Ти подреди картинката успешно! Ето твоята изненада!"
          onConfirm={() => {
            if (slideshowKey || slideshowKey !== "") {
              router.push(`/slideshows/${slideshowKey}`);
            } else {
              router.push(`/invitations/preview/${slug}/schedule`);
            }
          }}
        />
      )}
    </div>
  );
}
