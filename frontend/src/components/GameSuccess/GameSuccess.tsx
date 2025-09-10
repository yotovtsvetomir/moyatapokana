"use client";

import React from "react";
import styles from "./GameSuccess.module.css";

interface GameSuccessProps {
  title?: string;
  message: string;
  onConfirm: () => void;
}

const GameSuccess: React.FC<GameSuccessProps> = ({ title = "🎉 Браво! 🎉", message, onConfirm }) => {
  return (
    <div className={styles.successOverlay}>
      <div className={styles.successBox}>
        <h2>{title}</h2>
        <p>{message}</p>
        <button onClick={onConfirm}>Виж изненада</button>
      </div>
    </div>
  );
};

export default GameSuccess;
