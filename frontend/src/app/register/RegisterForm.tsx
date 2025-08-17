"use client";

import React, { useState } from "react";
import styles from "./RegisterForm.module.css";
import { Input } from "@/ui-components/Input/Input";
import { Button } from "@/ui-components/Button/Button";
import { components } from "@/shared/types"; 

type RegisterFormValues = components["schemas"]["UserCreate"];

type RegisterFormErrors = {
  [K in keyof RegisterFormValues]?: string;
} & {
  confirmPassword?: string;
  apiError?: string;
};

export function RegisterForm() {
  const [values, setValues] = useState<RegisterFormValues>({
    username: "",
    password: "",
    first_name: "",
    last_name: "",
  });

  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const errs: RegisterFormErrors = {};

    if (!values.first_name) {
      errs.first_name = "Моля, въведете име";
    }

    if (!values.last_name) {
      errs.last_name = "Моля, въведете фамилия";
    }

    if (!values.username) {
      errs.username = "Моля, въведете имейл";
    }

    if (!values.password) {
      errs.password = "Моля, въведете парола";
    }

    if (!confirmPassword) {
      errs.confirmPassword = "Моля, потвърдете паролата";
    }

    return errs;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ apiError: data.error || "Регистрацията неуспешна" });
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
  };

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <h2>Регистрация</h2>

      <Input
        id="first_name"
        name="first_name"
        type="text"
        label="Име"
        value={values.first_name}
        onChange={handleChange}
        error={errors.first_name}
        required
      />

      <Input
        id="last_name"
        name="last_name"
        type="text"
        label="Фамилия"
        value={values.last_name}
        onChange={handleChange}
        error={errors.last_name}
        required
      />

      <Input
        id="username"
        name="username"
        type="email"
        label="Имейл"
        value={values.username}
        onChange={handleChange}
        error={errors.username}
        required
      />

      <Input
        id="password"
        name="password"
        type="password"
        label="Парола"
        value={values.password}
        onChange={handleChange}
        error={errors.password}
        required
      />

      <Input
        id="confirmPassword"
        name="confirmPassword"
        type="password"
        label="Потвърдете паролата"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        error={errors.confirmPassword}
        required
      />

      <Button type="submit" variant="primary" size="large" bold disabled={loading}>
        {loading ? "Регистриране..." : "Регистрирай се"}
      </Button>

      {errors.apiError && <p className={styles.error}>{errors.apiError}</p>}
    </form>
  );
}
