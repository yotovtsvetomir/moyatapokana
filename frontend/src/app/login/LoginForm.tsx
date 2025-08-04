"use client";

import React, { useState } from "react";
import styles from "./LoginForm.module.css";
import { Input } from "@/ui-components/Input/Input";
import { Button } from "@/ui-components/Button/Button";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Login failed");
      return;
    }

    window.location.href = "/profile";
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h2>Вход</h2>

      <Input
        id="username"
        name="username"
        type="email"
        label="Имейл"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
        icon="email"
      />

      <Input
        id="password"
        name="password"
        type="password"
        label="Парола"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        icon="lock"
      />

      <Button type="submit" variant="primary" size="large">
        Влез
      </Button>

      {error && <p className={styles.error}>{error}</p>}
    </form>
  );
}
