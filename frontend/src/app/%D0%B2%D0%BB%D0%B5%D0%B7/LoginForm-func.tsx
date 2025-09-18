"use client";

import React, { useState } from "react";
import styles from "./LoginForm.module.css";
import { Input } from "@/ui-components/Input/Input";
import { Button } from "@/ui-components/Button/Button";

export function LoginForm() {
  const [email, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; apiError?: string }>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const errs: { email?: string; password?: string } = {};

    if (!email) {
      errs.email = "Моля, въведете имейл";
    }

    if (!password) {
      errs.password = "Моля, въведете парола";
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

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrors({ apiError: data.detail || "Входът неуспешен" });
        return;
      }

      window.location.href = "/профил";
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
        id="email"
        name="email"
        type="email"
        label="Имейл"
        value={email}
        onChange={(e) => setUsername(e.target.value)}
        error={errors.email}
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
