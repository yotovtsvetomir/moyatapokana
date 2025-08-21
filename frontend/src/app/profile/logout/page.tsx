"use client";

import { useEffect, useState } from "react";

export default function LogoutPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const logout = async () => {
      try {
        const res = await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "include",
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Logout failed");
          setLoading(false);
          return;
        }
        window.location.href = "/";
      } catch (err) {
        setError("Server error: " + err);
        setLoading(false);
      }
    };

    logout();
  }, []);

  return (
    <div>
      {loading ? (
        <p>Logging out...</p>
      ) : (
        <p>{error}</p>
      )}
    </div>
  );
}
