"use client";

import React, { useState } from "react";
import styles from "./LoginForm.module.css";
import { Input } from "@/ui-components/Input/Input";
import { Button } from "@/ui-components/Button/Button";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ username?: string; password?: string; apiError?: string }>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const errs: { username?: string; password?: string } = {};

    if (!username) {
      errs.username = "Моля, въведете имейл";
    } else if (!/\S+@\S+\.\S+/.test(username)) {
      errs.username = "Невалиден имейл формат";
    }

    if (!password) {
      errs.password = "Моля, въведете парола";
    } else if (password.length < 8) {
      errs.password = "Паролата трябва да е поне 8 символа";
    }

    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrors({ apiError: data.error || "Входът неуспешен" });
        setLoading(false);
        return;
      }

      window.location.href = "/profile";
    } catch (error) {
      setErrors({
        apiError:
          error instanceof Error ? error.message : "Възникна грешка при сървъра",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <h2>Вход</h2>

      <Input
        id="username"
        name="username"
        type="email"
        label="Имейл"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        error={errors.username}
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
        error={errors.password}
        required
        icon="lock"
      />

      <Button type="submit" variant="primary" size="large" disabled={loading}>
        {loading ? "Влизане..." : "Влез"}
      </Button>

      {errors.apiError && <p className={styles.error}>{errors.apiError}</p>}
    </form>
  );
}
