"use client";

import React, { useState } from "react";
import { useUser } from "@/context/UserContext";
import styles from "./Profile.module.css";
import { Input } from "@/ui-components/Input/Input";
import { Button } from "@/ui-components/Button/Button";

export default function Profile() {
  const { user, setUser } = useUser();
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ first_name?: string; last_name?: string; apiError?: string }>({});
  const [message, setMessage] = useState("");
  const isChanged = firstName !== user.first_name || lastName !== user.last_name

  if (!user) {
    return <p>You are not logged in.</p>;
  }

  function validate() {
    const errs: { first_name?: string; last_name?: string } = {};
    if (!firstName) errs.first_name = "Моля, въведете име";
    if (!lastName) errs.last_name = "Моля, въведете фамилия";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setMessage("");

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name: firstName, last_name: lastName }),
        credentials: "include",
      });

      if (!res.ok) {
        const data = await res.json();
        setErrors({ apiError: data.detail || "Грешка при обновяване на профила" });
        return;
      }

      const updatedUser = await res.json();
      setUser(updatedUser);
      setMessage("Профилът е обновен успешно!");
    } catch (error) {
      setErrors({
        apiError: error instanceof Error ? error.message : "Възникна грешка при сървъра",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container fullHeight">
      <div className={styles.profile}>
        <h1>Профил</h1>
        <p>
          <strong>Имейл:</strong> {user.username}
        </p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <Input
            id="firstName"
            name="firstName"
            type="text"
            label="Име"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            error={errors.first_name}
            required
          />

          <Input
            id="lastName"
            name="lastName"
            type="text"
            label="Фамилия"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            error={errors.last_name}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="large"
            disabled={loading || !isChanged} // disabled if loading or nothing changed
          >
            {loading ? "Обновяване..." : "Обнови профила"}
          </Button>

          {errors.apiError && <p className={styles.error}>{errors.apiError}</p>}
          {message && <p className={styles.success}>{message}</p>}
        </form>
      </div>
    </div>
  );
}
