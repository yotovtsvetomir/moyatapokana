"use client";

import Image from "next/image";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import styles from "./Profile.module.css";
import DefaultAvatar from '@/assets/avatar.png';

export default function InfoForm() {
  const { user } = useUser();

  const avatarSrc = user?.profile_picture?.startsWith('http')
    ? user.profile_picture
    : DefaultAvatar;

  return (
    <div className="container fullHeight">
      <div className={styles.info}>
        <div className={styles.infoInner}>
          <h2>Настройки</h2>

          {/* Avatar */}
          <Link
            href="/profile/info/settings/avatar/"
            className={`${styles.infoGroup} ${styles.helper}`}
          >
            <div className={styles.infoContent}>
              <label>Профилна снимка</label>
            </div>
            <div className={styles.infoIcon}>
              <div className={styles.avatarWrapper}>
                <Image
                  src={avatarSrc}
                  alt="User Avatar"
                  width={57}
                  height={57}
                  unoptimized
                  className={styles.avatarImage}
                />
                <div className={styles.avatarOverlay}>
                  <span
                    className={`material-symbols-outlined ${styles.cameraIcon}`}
                  >
                    photo_camera
                  </span>
                </div>
              </div>
            </div>
          </Link>

          {/* Name */}
          <Link href="/profile/info/settings/name/" className={styles.infoGroup}>
            <div className={styles.infoContent}>
              <label>Име и фамилия</label>
              {(user?.first_name || user?.last_name) && (
                <p>{`${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim()}</p>
              )}
            </div>
            <div className={styles.infoIcon}>
              <span className="material-symbols-outlined">chevron_right</span>
            </div>
          </Link>

          {/* Email */}
          <Link
            href="/profile/info/settings/email/"
            className={styles.infoGroup}
          >
            <div className={styles.infoContent}>
              <label>Имейл</label>
              <p>{user?.email || "—"}</p>
            </div>

            <div className={styles.infoIcon}>
              <span className="material-symbols-outlined">chevron_right</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
