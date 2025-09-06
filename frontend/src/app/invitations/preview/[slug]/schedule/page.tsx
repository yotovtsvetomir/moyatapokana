"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from 'next/image';
import { useInvitation } from "@/context/InvitationContext";
import { useDynamicFont } from "@/hooks/useDynamicFont";

import confetti from "canvas-confetti";
import { motion } from "framer-motion";

import ConfirmModal from '@/ui-components/ConfirmModal/ConfirmModal';
import { Button } from "@/ui-components/Button/Button";
import styles from "./schedule.module.css";
import type { components } from "@/shared/types";


type Event = components["schemas"]["EventRead"];

function hexToRgba(hex, alpha = 1) {
  let r = 0, g = 0, b = 0;

  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } 

  else if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function Schedule() {
  const router = useRouter();
  const { invitation } = useInvitation();
  const fontFamily = useDynamicFont(invitation.font_obj)
  const [isPlaying, setIsPlaying] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showPurchaseConfirm, setShowPurchaseConfirm] = useState(false);
  const [purchaseErrors, setPurchaseErrors] = useState<string[] | null>(null);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleReplay = () => {
    if (!invitation?.slug) return;
    localStorage.setItem("replay", "true");
    router.replace(`/invitations/preview/${invitation.slug}`);
  };

  const handleBuyClick = async () => {
    try {
      const res = await fetch(`/api/invitations/${invitation.id}/ready`);
      if (!res.ok) throw new Error("Failed to check readiness");

      const data = await res.json();

      if (data.ready) {
        setPurchaseErrors(null);
        setShowPurchaseConfirm(true);
      } else {
        setPurchaseErrors(data.missing);
      }
    } catch (err) {
      console.error(err);
      setPurchaseErrors(["Възникна грешка при проверката за покупка."]);
    }
  };

  useEffect(() => {
    if (invitation?.slug) {
      const seenSlugs = JSON.parse(localStorage.getItem("seen_invitation_slugs") || "[]");
      if (!seenSlugs.includes(invitation.slug)) {
        seenSlugs.push(invitation.slug);
        localStorage.setItem("seen_invitation_slugs", JSON.stringify(seenSlugs));
      }
    }
  }, [invitation?.slug]);

  useEffect(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 120, zIndex: 0 };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: Math.random(), y: Math.random() * 0.5 },
        colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'],
        shapes: ['circle'],
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const defaults = {
      spread: 360,
      ticks: 50,
      gravity: 0,
      decay: 0.94,
      startVelocity: 30,
      colors: ['#FFE400', '#FFBD00', '#E89400', '#FFCA6C', '#FDFFB8']
    };

    let repeatCount = 0;

    const shootStars = () => {
      repeatCount++;
      function shoot() {
        confetti({
          ...defaults,
          particleCount: 40,
          scalar: 1.2,
          shapes: ['star']
        });

        confetti({
          ...defaults,
          particleCount: 10,
          scalar: 0.75,
          shapes: ['circle']
        });
      }

      const timeouts = [
        setTimeout(shoot, 0),
        setTimeout(shoot, 100),
        setTimeout(shoot, 200)
      ];

      if (repeatCount < 3) {
        setTimeout(shootStars, 1000);
      }

      return () => timeouts.forEach(clearTimeout);
    };

    shootStars();
  }, []);

  useEffect(() => {
    if (invitation.background_audio && audioRef.current) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [invitation.background_audio]);

  const renderTimeline = (events: Event[]) => {
    const timelineRef = useRef<HTMLDivElement | null>(null);
    const fillRef = useRef<HTMLDivElement | null>(null);

    // Scroll-fill effect
    useEffect(() => {
      const handleScroll = () => {
        if (!timelineRef.current || !fillRef.current) return;

        const timeline = timelineRef.current;
        const fill = fillRef.current;
        const rect = timeline.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        const timelineTop = rect.top;
        const timelineHeight = rect.height;
        const scrollStart = windowHeight * 0.6;
        const scrollEnd = timelineHeight * 0.7;

        const pixelsScrolled = Math.max(0, windowHeight - timelineTop - scrollStart);
        const fillRange = scrollEnd;

        const progress = Math.min(pixelsScrolled / fillRange, 1);
        const fillHeight = Math.max(progress * timelineHeight, 100);

        fill.style.height = `${fillHeight}px`;

        const dotItems = timeline.querySelectorAll<HTMLElement>('[data-index]');
        dotItems.forEach((item) => {
          item.classList.toggle(styles.active, fillHeight >= item.offsetTop);
        });
      };

      window.addEventListener("scroll", handleScroll);
      requestAnimationFrame(() => setTimeout(handleScroll, 100));

      return () => window.removeEventListener("scroll", handleScroll);
    }, [events]);

    if (!events || events.length === 0) return null;

    return (
      <div className={styles.timeline} ref={timelineRef}>
        <div className={styles.timelineTrack} />
        <div className={styles.timelineFilled} ref={fillRef} />
        <ul className={styles.eventList}>
          {events.map((event, idx) => {
            const start = new Date(event.start_datetime);
            const end = event.finish_datetime ? new Date(event.finish_datetime) : null;

            const startTime = start.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit", hour12: false });
            const endTime = end ? end.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit", hour12: false }) : "";
            const date = start.toLocaleDateString("bg-BG", { day: "2-digit", month: "numeric", year: "numeric" });

            return (
              <li
                key={event.id}
                className={styles.eventItem}
                data-index={idx}
              >
                <div className={styles.eventCardWrapper}>
                  <div className={styles.eventCard}>
                    <div className={styles.eventInfo}>
                      <div className={styles.eventInfoInner}>
                        <div className={styles.eventInfoGroup}>
                          <div className={styles.eventInfoLabel}>
                            <span className="material-symbols-outlined">schedule</span>
                          </div>
                          <p>{startTime} ч. {endTime ? ` - ${endTime} ч.` : ""}</p>
                        </div>

                        <div className={styles.eventInfoGroup}>
                          <div className={styles.eventInfoLabel}>
                            <span className="material-symbols-outlined">calendar_today</span>
                          </div>
                          <p>{date}</p>
                        </div>

                        <div className={styles.eventInfoGroup}>
                          <div className={styles.eventInfoLabel}>
                            <span className="material-symbols-outlined">location_on</span>
                          </div>
                          <p>{event.location || "—"}</p>
                        </div>
                      </div>

                      <div className={styles.eventText} style={{ borderColor: invitation.primary_color }}>
                        <h4>{`${idx + 1}. ${event.title}` || `Събитие ${idx + 1}`}</h4>
                        {event.description && <p>{event.description || ""}</p>}
                      </div>

                      <div className={styles.actions}>
                        <Button
                          variant="basic"
                          icon="location_on"
                          iconPosition="left"
                          size="large"
                          color={invitation.primary_color}
                          href={event.location_link}
                          target="_blank"
                        >
                          Локация
                        </Button>

                        <Button
                          variant="basic"
                          icon="calendar_today"
                          iconPosition="left"
                          size="large"
                          color={invitation.primary_color}
                          href={event.calendar_link}
                          target="_blank"
                        >
                          Запази
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            )})}
        </ul>
      </div>
    );
  };

  const containerVariants = {
    hidden: { opacity: 1 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "linear",
      },
    },
  };

  return (
    <div 
      className={styles.wrapper}
      style={{
        '--primary-color': invitation.primary_color,
        '--secondary-color': invitation.secondary_color || invitation.primary_color,
      } as React.CSSProperties}
    >
      <div className={styles.invitation}>
        <Image
          src={invitation.wallpaper}
          alt="Invitation background"
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
          {invitation.title && (
            <motion.div
              className={styles.title}
              style={{ color: invitation.primary_color, fontFamily }}
              variants={itemVariants}
            >
              <h1>{invitation.title}</h1>
            </motion.div>
          )}

          {invitation.description &&
            invitation.description
              .split("\n")
              .filter((p) => p.trim())
              .map((p, i) => (
                <motion.p
                  key={i}
                  style={{ color: invitation.primary_color, fontFamily }}
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
              style={{
                color: `${invitation.primary_color}`,
                fontSize: "2rem"
              }}
            >
              south
            </span>
          </div>
        </div>
      </div>

      <div id="events" className="container cneterWrapper">
        {/* Events Timeline */}
        <h2 className={styles.sectionTitle}>
          {invitation.events.length === 1 ? "Събитие" : "Събития"}
        </h2>
        {renderTimeline(invitation.events)}

        {/* Extra Info */}
        {invitation.extra_info && (
          <>
            <h2 className={styles.sectionTitle}>Инфо</h2>
            <div 
              className={styles.extraInfo}
              style={{
                boxShadow: `
                  0px 1px 3px ${hexToRgba(invitation.primary_color, 0.2)},
                  0px 1px 2px ${hexToRgba(invitation.primary_color, 0.14)},
                  0px 2px 1px -1px ${hexToRgba(invitation.primary_color, 0.12)}
                `,
              }}
            >
              {invitation.extra_info
                .split("\n")
                .filter((p) => p.trim())
                .map((p, i) => (
                  <div
                    key={i}
                    style={{ borderColor: invitation.primary_color }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{
                        color: `${invitation.primary_color}`,
                        fontSize: "1.5rem"
                      }}
                    >
                      info
                    </span>
                    <p>{p}</p>
                  </div>
                ))}
            </div>
          </>
        )}

        {/* RSVP Section */}
        <h2 className={styles.sectionTitle}>Присъствие</h2>
        <div className={styles.rsvp}>
          <Button
            size="large"
            variant="basic"
            icon="person_check"
            iconPosition="left"
            color={invitation.primary_color}
            width="100%"
            href={`/invitations/preview/${invitation.slug}/rsvp`}
          >
            Потвърдете
          </Button>
        </div>

        {/* Background Music */}
        {invitation.background_audio && (
          <>
            <audio ref={audioRef} src={invitation.background_audio} loop />
            <div className={styles.audioToggle}>
              <button onClick={toggleAudio}>
                <span
                  className="material-symbols-outlined"
                  style={{ color: invitation.primary_color }}
                >
                  {isPlaying ? "volume_up" : "volume_off"}
                </span>
              </button>
            </div>
          </>
        )}

        {/* Footer Controls */}
        <div className={styles.footer}>
          {invitation.status === 'draft' && 
            <Button 
              variant="basic"
              color={invitation.primary_color}
              size="large"
              width="100%"
              icon="edit"
              iconPosition="left"
              href={`/invitations/edit/${invitation.id}/settings`}
            >
              Редактиране
            </Button>
          }

          {invitation.is_template && 
            <Button variant="secondary" size="middle" width="100%">
              Използвай шаблон
            </Button>
          }

          <Button
            variant="basic"
            color={invitation.primary_color}
            size="large"
            width="100%"
            icon="replay"
            iconPosition="left"
            onClick={handleReplay}
          >
            Повтори
          </Button>

          {invitation.status === 'draft' && (
            <Button
              variant="primary"
              size="middle"
              width="100%"
              icon="shopping_cart"
              iconPosition="right"
              onClick={handleBuyClick}
            >
              Купи
            </Button>
          )}

          {purchaseErrors && (
            <div className={styles.purchaseErrors}>
              <strong>Не може да закупите поканата. Липсват задължителни полета:</strong>
              <ul>
                {purchaseErrors.map((field) => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
            </div>
          )}

          {invitation.status === 'draft' &&
            <div className={styles.footerInfo}>
              <span className="material-symbols-outlined">error</span>
              <p className={styles.draftInfo}>
                Ако не бъдат използвани черновите ще бъдат изтрити след 30 дни от създаването им.
              </p>
            </div>
          }
        </div>
      </div>

      {showPurchaseConfirm && (
        <ConfirmModal
          title="Сигурни ли сте?"
          description={[
            "След активиране, тази покана не може да бъде редактирана. Моля, прегледайте внимателно съдържанието, преди да продължите.",
            "Ако все пак откриете грешка след активиране, пишете ни на support@moyatapokana.com.",
          ]}
          confirmText="Продължи"
          cancelText="Назад"
          onConfirm={() => {
            setShowPurchaseConfirm(false);
            router.push(`/checkout/${invitation.id}`);
          }}
          onCancel={() => setShowPurchaseConfirm(false)}
        />
      )}
    </div>
  );
}
