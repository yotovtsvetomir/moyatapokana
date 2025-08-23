"use client";

import Link from "next/link";
import { useState } from "react";
import { useUser } from "@/context/UserContext";

import { Input } from "@/ui-components/Input/Input";
import { Button } from "@/ui-components/Button/Button";
import styles from "../../Profile.module.css";

export default function EditEmailForm() {
  const { user } = useUser();
  const [email, setEmail] = useState(user?.email || "");

  return (
    <div className="container fullHeight">
      <div className={styles.sectionWrapper}>
        <h2>Имейл</h2>

        <form noValidate>
          <Input
            id="email"
            name="email"
            label="Имейл"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            size="large"
            required
            disabled
          />

          <div className={styles.avatarActions}>
            <Link href="/profile/info">
              <Button variant="ghost">Назад</Button>
            </Link>

            <Button disabled>Запази</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
