"use client";

import React from "react";
import styles from "./GameFooter.module.css";

interface GameFooterProps {
  current: number;
  total: number;
  onSkip?: () => void;
  showSkip?: boolean;
  showIndicator?: boolean;
}

const GameFooter: React.FC<GameFooterProps> = ({ current, total, onSkip, showSkip, showIndicator=true }) => {
  return (
    <div className={styles.progressBarFooter}>
      {showIndicator &&
        <div className={styles.progressBarWrapper}>
          <div className={styles.progressBarBG}></div>
          <div className={styles.progressBarFill} style={{ width: `${Math.min(current / total, 1) * 100}%` }}></div>
          <div className={styles.progressBarText}>
            <span className={styles.currentNum}>{current}</span>
            <span className={styles.slash}>/</span>
            <span className={styles.totalNum}>{total}</span>
          </div>
        </div>
      }
      {showSkip && onSkip && <button type="button" onClick={onSkip}>Пропусни</button>}
    </div>
  );
};

export default GameFooter;
