"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTemplate } from "@/context/TemplateContext";
import { useUser } from "@/context/UserContext";
import { useDynamicFont } from "@/hooks/useDynamicFont";

import { motion } from "framer-motion";
import { Button } from "@/ui-components/Button/Button";
import ConfirmModal from "@/ui-components/ConfirmModal/ConfirmModal";
import styles from "./schedule.module.css";

export default function TemplatePreview() {
  const router = useRouter();
  const { user } = useUser();
  const { template } = useTemplate();
  const fontFamily = useDynamicFont(template?.font_obj);

  const [isPlaying, setIsPlaying] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState<{
    title: string;
    description: string | string[];
    confirmText?: string;
    danger?: boolean;
    onConfirm?: () => void;
  } | null>(null);

  const createFromTemplate = async (deleteOld = false) => {
    if (!template?.slug) return;

    try {
      const res = await fetch(
        `/api/invitations/create-from-template/${template.slug}${
          deleteOld ? "?delete_old=true" : ""
        }`,
        { method: "POST", credentials: "include" }
      );

      if (!res.ok) {
        const err = await res.json();
        const detail = err.error;

        if (res.status === 400) {
          if (detail.anon) {
            setModalConfig({
              title: "Вече имате чернова",
              description: detail.error,
              confirmText: "Изтрий и използвай",
              danger: true,
              onConfirm: async () => {
                setShowModal(false);
                await createFromTemplate(true);
              },
            });
            setShowModal(true);
          } else {
            setModalConfig({
              title: "Лимит от чернови",
              description: [
                detail.error,
                "Моля, отидете в профила си и изтрийте една чернова.",
              ],
              confirmText: "Към профила",
              onConfirm: () => {
                setShowModal(false);
                router.push("/profile/invitations");
              },
            });
            setShowModal(true);
          }
        }
        return;
      }

      const data = await res.json();
      router.push(`/invitations/edit/${data.id}`);
    } catch (error) {
      console.error("Failed to use template:", error);
    }
  };

  const handleUseTemplate = () => {
    createFromTemplate();
  };

  const handleReplay = () => {
    if (!template?.slug) return;
    localStorage.setItem("replay", "true");
    router.replace(`/templates/preview/${template.slug}`);
  };

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    if (template?.background_audio && audioRef.current) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [template?.background_audio]);

  const containerVariants = {
    hidden: { opacity: 1 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "linear" },
    },
  };

  if (!template) return <p>Зареждане...</p>;

  return (
    <div
      className={styles.wrapper}
      style={
        {
          "--primary-color": template.primary_color,
          "--secondary-color": template.secondary_color || template.primary_color,
        } as React.CSSProperties
      }
    >
      <div className={styles.invitation}>
        <Image
          src={template.wallpaper}
          alt="Template background"
          fill
          priority
          unoptimized
          className={styles.bgImage}
        />
        <motion.div
          className={styles.content}
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {template.title && (
            <motion.div
              className={styles.title}
              style={{ color: template.primary_color, fontFamily }}
              variants={itemVariants}
            >
              <h1>{template.title}</h1>
            </motion.div>
          )}

          {template.description &&
            template.description
              .split("\n")
              .filter((p) => p.trim())
              .map((p, i) => (
                <motion.p
                  key={i}
                  style={{ color: template.primary_color, fontFamily }}
                  className={styles.description}
                  variants={itemVariants}
                >
                  {p}
                </motion.p>
              ))}
        </motion.div>

        <div
          className={styles.pointer}
          onClick={() => {
            const section = document.getElementById("events");
            section?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <div className={styles.pointerCircle}>
            <span
              className={`material-symbols-outlined ${styles.arrowBounce}`}
              style={{ color: `${template.primary_color}`, fontSize: "2rem" }}
            >
              south
            </span>
          </div>
        </div>
      </div>

      {/* Background Music */}
      {template.background_audio && (
        <>
          <audio ref={audioRef} src={template.background_audio} loop />
          <div className={styles.audioToggle}>
            <button onClick={toggleAudio}>
              <span
                className="material-symbols-outlined"
                style={{ color: template.primary_color }}
              >
                {isPlaying ? "volume_up" : "volume_off"}
              </span>
            </button>
          </div>
        </>
      )}

      {/* Footer Controls */}
      <div className={styles.footer}>
        <Button
          variant="secondary"
          size="large"
          onClick={() => router.push("/templates")}
        >
          Разгледай други
        </Button>

        <Button
          variant="primary"
          size="large"
          width="100%"
          onClick={handleUseTemplate}
        >
          Използвай шаблона
        </Button>

        <Button
          variant="basic"
          color={template.primary_color}
          size="large"
          width="100%"
          icon="replay"
          iconPosition="left"
          onClick={handleReplay}
        >
          Повтори
        </Button>
      </div>

      {showModal && modalConfig && (
        <ConfirmModal
          title={modalConfig.title}
          description={modalConfig.description}
          confirmText={modalConfig.confirmText}
          danger={modalConfig.danger}
          onConfirm={modalConfig.onConfirm || (() => setShowModal(false))}
          onCancel={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
