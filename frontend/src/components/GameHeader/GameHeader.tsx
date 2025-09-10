"use client";

import React from "react";
import styles from "./GameHeader.module.css";

interface GameHeaderProps {
  title: string;
}

const GameHeader: React.FC<GameHeaderProps> = ({ title }) => {
  return (
    <div className={styles.headingBanner}>
      <h1 className={styles.heading}>{title}</h1>
    </div>
  );
};

export default GameHeader;
