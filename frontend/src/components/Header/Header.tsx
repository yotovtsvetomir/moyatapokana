"use client";

import styles from './Header.module.css';
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { useState } from "react";

const Header = () => {
  const { user, setUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!res.ok) {
        // Try to parse error body, fallback gracefully
        const data = await res.json().catch(() => null);
        setError(data?.detail || "Грешка при излизане");
        setLoading(false);
        return;
      }

      setUser(null);
      window.location.href = "/";
    } catch (err) {
      setError("Възникна грешка при излизане");
    } finally {
      // Always turn loading off
      setLoading(false);
    }
  }

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <h1 className={styles.logo}>Auth flow</h1>
        <nav>
          <ul className={styles.navList}>
            <li><Link href="/" className={styles.navLink}>Начало</Link></li>
            {user && (
              <>
                <li><Link href="/profile" className={styles.navLink}>Профил</Link></li>
                <li>
                  <button
                    className={styles.navLink}
                    onClick={handleLogout}
                    disabled={loading}
                    style={{ cursor: loading ? "not-allowed" : "pointer", background: "none", border: "none", padding: 0, font: "inherit", color: "inherit" }}
                  >
                    {loading ? "Излизане..." : "Излез"}
                  </button>
                </li>
              </>
            )}
          </ul>
        </nav>
        {error && <p className={styles.error}>{error}</p>}
      </div>
    </header>
  );
};

export default Header;
