"use client";

import React from "react";
import { useUser } from "@/context/UserContext";
import styles from './Profile.module.css'

export default function Profile() {
  const { user } = useUser();

  if (!user) {
    return <p>You are not logged in.</p>;
  }

  return (
    <div className="container fullHeight">
      <div className={styles.profile}>
        <h1>Профил</h1>
        <p>
          <strong>Имейл:</strong> {user.username}
        </p>
      </div>
    </div>
  );
}
