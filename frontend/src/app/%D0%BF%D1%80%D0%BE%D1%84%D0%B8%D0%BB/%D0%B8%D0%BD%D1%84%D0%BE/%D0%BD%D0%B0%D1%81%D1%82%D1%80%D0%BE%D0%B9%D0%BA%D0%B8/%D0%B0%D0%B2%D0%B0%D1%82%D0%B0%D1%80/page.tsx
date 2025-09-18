"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useUser } from "@/context/UserContext";

import { Button } from "@/ui-components/Button/Button";
import styles from "../../Profile.module.css";
import DefaultAvatar from '@/assets/avatar.png';

export default function Editprofile_pictureForm() {
  const { user, setUser } = useUser();
  const [profile_picture, setprofile_picture] = useState<File | null>(null);
  const [preview, setPreview] = useState(user?.profile_picture || "");
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setprofile_picture(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !profile_picture) return;

    setLoading(true);

    const formData = new FormData();
    formData.append("profile_picture", profile_picture);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        method: "PATCH",
        body: formData,
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("profile_picture update failed:", data);
        return;
      }

      setUser(prevUser =>
        prevUser ? { ...prevUser, profile_picture: data.profile_picture } : null
      );
      setPreview(data.profile_picture);
    } catch (err) {
      console.error("profile_picture update failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const profile_pictureSrc = preview || user?.profile_picture || DefaultAvatar;

  return (
    <div className="container fullHeight">
      <div className={styles.sectionWrapper}>
        <h2>Профилна снимка</h2>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              position: "relative",
              width: 300,
              height: 300,
              borderRadius: "50%",
              overflow: "hidden",
              margin: "0 auto",
            }}
          >
            <Image
              src={profile_pictureSrc}
              alt="User Avatar"
              width={300}
              height={300}
              unoptimized
              className={styles.avatarImage}
            />
          </div>

          <div className={styles.avatarUpload}>
            <input
              id="profile_picture-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <label htmlFor="profile_picture-upload">
              <span className={styles.btnContent}>Качи профилна снимка</span>
              <span className="material-symbols-outlined">add_a_photo</span>
            </label>
          </div>

          <div className={styles.avatarActions}>
            <Link href="/профил/инфо">
              <Button variant="ghost">Назад</Button>
            </Link>

            <Button type="submit" disabled={loading || !profile_picture}>
              {loading ? "Качване..." : "Запази"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
