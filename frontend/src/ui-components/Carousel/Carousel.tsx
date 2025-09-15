"use client";

import * as React from "react";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";

interface CarouselProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  interval?: number;
  minHeight?: string | number;
  autoPlay?: boolean;
}

export function Carousel<T>({
  items,
  renderItem,
  interval = 5000,
  minHeight = 400,
  autoPlay = false,
}: CarouselProps<T>) {
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [loaded, setLoaded] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const animationFrame = React.useRef<number | null>(null);
  const startTime = React.useRef<number>(0);

  const [sliderRef, slider] = useKeenSlider<HTMLDivElement>({
    loop: true,
    slides: { perView: 1.3, spacing: 20 },
    breakpoints: { "(min-width: 768px)": { slides: { perView: 3, spacing: 20 } } },
    created() {
      setLoaded(true);
      startTime.current = performance.now();
      animate();
    },
    slideChanged(s) {
      setCurrentSlide(s.track.details.rel);
      startTime.current = performance.now();
    },
  });

 const progressRef = React.useRef(0);

  const animate = () => {
    if (!autoPlay) return;

    const step = (time: number) => {
      const elapsed = time - startTime.current;
      const pct = Math.min((elapsed / interval) * 100, 100);
      progressRef.current = pct;

      // Update React state less frequently
      if (Math.floor(pct) !== Math.floor(progress)) {
        setProgress(pct);
      }

      if (pct >= 100) {
        slider.current?.next();
        startTime.current = performance.now();
        progressRef.current = 0;
      }

      animationFrame.current = requestAnimationFrame(step);
    };
    animationFrame.current = requestAnimationFrame(step);
  };

  React.useEffect(() => {
    return () => {
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    };
  }, []);

  return (
    <div>
      {!loaded && (
        <div
          style={{
            minHeight: typeof minHeight === "number" ? `${minHeight}px` : minHeight,
            background: "#eee",
            borderRadius: "8px",
          }}
        />
      )}

      <div
        ref={sliderRef}
        style={{
          visibility: loaded ? "visible" : "hidden",
          minHeight: typeof minHeight === "number" ? `${minHeight}px` : minHeight,
        }}
        className="keen-slider"
      >
        {items.map((item, index) => (
          <div key={index} className="keen-slider__slide" style={{ boxSizing: "border-box" }}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {loaded && (
        <div style={{ marginTop: "0.5rem" }}>
          {/* Progress bar */}
          <div
            style={{
              height: "0.5rem",
              background: "#eee",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress}%`,
                height: "100%",
                background: "#FF6A5B",
                borderRadius: "8px",
              }}
            />
          </div>

          {/* Dot indicators */}
          <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
            {items.map((_, idx) => (
              <button
                key={idx}
                onClick={() => slider.current?.moveToIdx(idx)}
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  border: "none",
                  background: idx === currentSlide ? "#FF6A5B" : "#ccc",
                  cursor: "pointer",
                  transition: "background 0.3s",
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
