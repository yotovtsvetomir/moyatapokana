"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/ui-components/Modal/Modal";
import { useUser } from "@/context/UserContext";

const SESSION_TIMEOUT = 1000 * 60 * 15;
const COUNTDOWN_SECONDS = 10;

export default function SessionTimeoutHandler() {
  const { user } = useUser();
  const [showPrompt, setShowPrompt] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();

  // Reset timer on user activity
  const resetTimeout = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    setShowPrompt(false);
    setCountdown(COUNTDOWN_SECONDS);

    timeoutRef.current = setTimeout(() => {
      setShowPrompt(true);
      startCountdown();
    }, SESSION_TIMEOUT);
  };

  useEffect(() => {
    if (!user) return;

    // Start initial timeout
    resetTimeout();

    // Events to listen for user activity
    const events = ["mousemove", "keydown", "click", "scroll"];

    // Attach event listeners to reset timer
    events.forEach((event) =>
      window.addEventListener(event, resetTimeout)
    );

    // Cleanup event listeners on unmount
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      events.forEach((event) =>
        window.removeEventListener(event, resetTimeout)
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const startCountdown = () => {
    let timeLeft = COUNTDOWN_SECONDS;
    setCountdown(timeLeft);

    countdownIntervalRef.current = setInterval(() => {
      timeLeft -= 1;
      setCountdown(timeLeft);
      if (timeLeft <= 0) {
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        handleLogout();
      }
    }, 1000);
  };

  const refreshSession = async () => {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      if (res.ok) {
        setShowPrompt(false);
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        resetTimeout();
      } else {
        handleLogout();
      }
    } catch {
      handleLogout();
    }
  };

  const handleLogout = () => {
    setShowPrompt(false);
    fetch("/api/auth/logout", { method: "POST" }).catch((err) =>
      console.error("Logout error:", err)
    );
    router.push("/login");
  };

  if (!user || !showPrompt) return null;

  return (
    <Modal
      title="Времето на сесията изтича"
      description={`Вашата сесия ще изтече след ${countdown} секунди. Искате ли да я удължите?`}
      confirmText="Да"
      cancelText="Не"
      onConfirm={refreshSession}
      onCancel={handleLogout}
      danger={false}
    />
  );
}
