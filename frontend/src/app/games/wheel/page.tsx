"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import GameSuccess from "@/components/GameSuccess/GameSuccess";
import GameHeader from "@/components/GameHeader/GameHeader";
import GameFooter from "@/components/GameFooter/GameFooter";
import styles from "./wheel.module.css";

const WHEEL_SEGMENTS = ["🎁", "🎉", "💎", "🍀", "🏆", "🎈", "✨"];

const SEGMENT_COLORS = [
  "#FF6B6B",
  "#FFD93D",
  "#6BCB77",
  "#4D96FF",
  "#FF6EC7",
  "#FF9F1C",
  "#845EC2",
];

export default function WheelPage() {
  const router = useRouter();
  const wheelRef = useRef<HTMLDivElement | null>(null);
  const pointerRef = useRef<HTMLDivElement | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const segmentRefs = useRef<Array<SVGTextElement | null>>([]);

  const [charging, setCharging] = useState(false);
  const [power, setPower] = useState(0);
  const chargeSound = useRef<HTMLAudioElement | null>(null);
  const chargeRef = useRef<number | null>(null);
  const currentRotation = useRef(0);

  const [slug, setSlug] = useState("");
  const [slideshowKey, setSlideshowKey] = useState("");
  const [primaryColor, setPrimaryColor] = useState("");
  const [secondaryColor, setSecondaryColor] = useState("");
  const [showSkip, setShowSkip] = useState(false);

  const spinSound = useRef<HTMLAudioElement | null>(null);
  const victorySound = useRef<HTMLAudioElement | null>(null);

  const radius = 150;
  const center = 150;

  function startCharging() {
    if (spinning) return;
    setCharging(true);
    setPower(0);

    if (chargeSound.current) {
      chargeSound.current.currentTime = 0;
      chargeSound.current.loop = true;
      chargeSound.current.play();
    }

    chargeRef.current = setInterval(() => {
      setPower((prev) => {
        if (prev >= 100) {
          if (chargeRef.current) clearInterval(chargeRef.current);
          return 100;
        }
        return prev + 1;
      });
    }, 10);
  }

  function stopCharging() {
    if (!charging) return;
    setCharging(false);
    if (chargeRef.current) clearInterval(chargeRef.current);

    if (chargeSound.current) {
      chargeSound.current.pause();
      chargeSound.current.currentTime = 0;
    }

    const strength = 1 + (power / 100) * 5;
    spinWheel(strength);

    setPower(0);
  }

  function spinWheel(strength: number) {
    if (!wheelRef.current) return;

    setSpinning(true);
    setResult(null);
    spinSound.current?.play();

    const segmentAngle = 360 / WHEEL_SEGMENTS.length;
    const extraRotation = strength * 360 + Math.random() * 360;
    const newRotation = currentRotation.current + extraRotation;

    wheelRef.current.style.transition = "transform 4s cubic-bezier(0.33,1,0.68,1)";
    wheelRef.current.style.transform = `rotate(${newRotation}deg)`;

    setTimeout(() => {
      spinSound.current.pause();
      setSpinning(false);

      if (!wheelRef.current || !pointerRef.current) return;

      const wheelRect = wheelRef.current.getBoundingClientRect();
      const centerX = wheelRect.left + wheelRect.width / 2;
      const centerY = wheelRect.top + wheelRect.height / 2;

      const pointerRect = pointerRef.current.getBoundingClientRect();
      const pointerX = pointerRect.left + pointerRect.width / 2;
      const pointerY = pointerRect.top;

      let closestIndex = 0;
      let minAngularDistance = Infinity;

      segmentRefs.current.forEach((segEl, i) => {
        if (!segEl) return;

        const segRect = segEl.getBoundingClientRect();
        const segX = segRect.left + segRect.width / 2;
        const segY = segRect.top + segRect.height / 2;

        const segAngle = Math.atan2(segY - centerY, segX - centerX);
        const pointerAngle = Math.atan2(pointerY - centerY, pointerX - centerX);

        let delta = Math.abs(segAngle - pointerAngle);
        if (delta > Math.PI) delta = 2 * Math.PI - delta;

        if (delta < minAngularDistance) {
          minAngularDistance = delta;
          closestIndex = i;
        }
      });

      setResult(WHEEL_SEGMENTS[closestIndex]);
      victorySound.current?.play();
      currentRotation.current = newRotation;
    }, 4200);

  }

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
    document.documentElement.style.setProperty("--invitation-primary", primaryColor);
    document.documentElement.style.setProperty("--invitation-bg-light", secondaryColor);
    document.documentElement.style.setProperty("--invitation-bg-medium", "rgba(255, 250, 240, 0.90)");
    document.documentElement.style.setProperty("--invitation-bg-dark", "#181818");
    document.documentElement.style.setProperty("--invitation-text-main", "#2C3E50");
  }, [primaryColor, secondaryColor]);

  return (
    <div className={styles.wrapper}>
      <Image src="/bgr.webp" alt="Background" fill style={{ objectFit: "cover", position: "absolute", top: 0, left: 0, zIndex: 0 }} priority />
      <audio ref={chargeSound} src="/charge.wav" preload="auto" />
      <audio ref={spinSound} src="/spintest.wav" preload="auto" />
      <audio ref={victorySound} src="/tada.wav" preload="auto" />

      <GameHeader title="Колело на късмета" />

      <div style={{ position: "relative", width: 350, height: 350 }}>
        {/* Pointer */}
        <div
          style={{
            position: "absolute",
            top: "-7px",
            left: "50%",
            transform: "translateX(-50%)",
            width: 20,
            height: 20,
            zIndex: 2,
          }}
        >
          {/* Triangle pointer */}
          <div
            ref={pointerRef}
            style={{
              width: 0,
              height: 0,
              borderLeft: "13px solid transparent",
              borderRight: "13px solid transparent",
              borderTop: `26px solid ${primaryColor || "red"}`,
              margin: "0 auto",
            }}
          />
        </div>

        {/* SVG Wheel */}
        <svg
          ref={wheelRef}
          viewBox="0 0 300 300"
          width="350"
          height="350"
          style={{ borderRadius: "50%", border: "6px solid #E0AA3E" }}
        >
          {WHEEL_SEGMENTS.map((seg, i) => {
            const angle = (2 * Math.PI) / WHEEL_SEGMENTS.length;
            const startAngle = i * angle;
            const endAngle = startAngle + angle;

            const x1 = center + radius * Math.cos(startAngle);
            const y1 = center + radius * Math.sin(startAngle);
            const x2 = center + radius * Math.cos(endAngle);
            const y2 = center + radius * Math.sin(endAngle);

            const midAngle = startAngle + angle / 2;
            const tx = center + radius * 0.77 * Math.cos(midAngle);
            const ty = center + radius * 0.77 * Math.sin(midAngle);

            return (
              <g key={i}>
                <path
                  ref={(el) => (segmentRefs.current[i] = el)}
                  d={`M${center},${center} L${x1},${y1} A${radius},${radius} 0 0,1 ${x2},${y2} Z`}
                  fill={SEGMENT_COLORS[i % SEGMENT_COLORS.length]}
                  stroke="white"
                  strokeWidth="2"
                />
                <text
                  x={tx}
                  y={ty}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${(midAngle * 180) / Math.PI}, ${tx}, ${ty})`}
                  fill="white"
                  fontSize="30"
                  fontWeight="bold"
                >
                  {seg}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Charge / Spin Bar */}
      <div
        className={styles.chargeContainer}
        onMouseDown={startCharging}
        onMouseUp={stopCharging}
        onMouseLeave={stopCharging}
        style={{
          marginTop: "1rem",
          width: "70%",
          height: "50px",
          background: "#ddd",
          borderRadius: "25px",
          overflow: "hidden",
          cursor: "pointer",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: "bold",
          fontSize: "1rem",
          color: "#fff",
          userSelect: "none",
        }}
      >
        {/* Fill bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: `${power}%`,
            height: "100%",
            background: primaryColor || "#f97316",
            transition: charging ? "none" : "width 0.2s",
            zIndex: 0,
          }}
        />
        {/* Text on top */}
        <span style={{ position: "relative", zIndex: 1 }}>Натисни и задръж</span>
      </div>

      {result && (
        <GameSuccess
          title="🎉 Честито! 🎉"
          message={`Ти спечели: ${result}`}
          onConfirm={() => router.push(`/slideshows/${slideshowKey || "demo"}`)}
          onSkip={showSkip ? () => router.push(`/slideshows/${slideshowKey || "demo"}`) : undefined}
          onReset={() => setResult(null)}
        />
      )}

      <GameFooter
        current={0}
        total={0}
        showSkip={false}
        showIndicator={false}
        onSkip={() => router.push("/")}
      />
    </div>
  );
}
