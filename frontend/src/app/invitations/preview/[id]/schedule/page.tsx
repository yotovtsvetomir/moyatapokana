"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useInvitation } from "@/context/InvitationContext";

import { motion } from "framer-motion";

import { Button } from "@/ui-components/Button/Button";
import styles from "./schedule.module.css";
import type { components } from "@/shared/types";


type Event = components["schemas"]["EventRead"];

export default function Schedule() {
  const router = useRouter();
  const { invitation } = useInvitation();
  const [isPlaying, setIsPlaying] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (invitation.background_audio && audioRef.current) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
  }, [invitation.background_audio]);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const renderTimeline = (events: Event[]) => {
    if (!events || events.length === 0) return null;

    return (
      <div className={styles.timeline}>
        {events.map((event, i) => (
          <div
            key={event.id}
            className={`${styles.event} ${
              events.length === 1 ? styles.singleEvent : ""
            }`}
          >
            <div className={styles.eventTime}>
              {new Date(event.start_datetime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
            <div className={styles.eventContent}>
              <h3>{event.title}</h3>
              {event.description && <p>{event.description}</p>}
              {event.location && (
                <p className={styles.location}>
                  📍{" "}
                  {event.location_link ? (
                    <a href={event.location_link} target="_blank">
                      {event.location}
                    </a>
                  ) : (
                    event.location
                  )}
                </p>
              )}
              {event.calendar_link && (
                <a
                  className={styles.calendarBtn}
                  href={event.calendar_link}
                  target="_blank"
                >
                  Добави в календара
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="">
      {/* Title */}
      {invitation.title && (
        <motion.h1
          className={styles.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {invitation.title}
        </motion.h1>
      )}

      {/* Description paragraphs */}
      {invitation.description &&
        invitation.description
          .split("\n")
          .filter((p) => p.trim())
          .map((p, i) => (
            <motion.p
              key={i}
              className={styles.description}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
            >
              {p}
            </motion.p>
          ))}

      {/* Extra Info */}
      {invitation.extra_info && (
        <div className={styles.extraInfo}>
          {invitation.extra_info
            .split("\n")
            .filter((p) => p.trim())
            .map((p, i) => (
              <p key={i}>{p}</p>
            ))}
        </div>
      )}

      {/* Events Timeline */}
      {renderTimeline(invitation.events)}

      {/* RSVP Section */}
      <div className={styles.rsvpSection}>
        <p>Моля потвърдете присъствието си.</p>
        <Button
          size="large"
          variant="primary"
          onClick={() => router.push("#rsvp")}
        >
          Потвърдете
        </Button>
      </div>

      {/* Background Music */}
      {invitation.background_audio && (
        <>
          <audio ref={audioRef} src={invitation.background_audio} loop />
          <div className={styles.audioToggle}>
            <Button
              variant="ghost"
              size="default"
              icon={isPlaying ? "pause" : "play_arrow"}
              onClick={toggleAudio}
            />
          </div>
        </>
      )}

      {/* Footer Controls */}
      <div className={styles.footer}>
        <Button variant="secondary" size="middle">
          Редактиране
        </Button>
        <p className={styles.draftInfo}>
          Ако не бъдат използвани черновите ще бъдат изтрити след 30 дни от създаването им.
        </p>
        <Button variant="secondary" size="middle">
          Използвай шаблон
        </Button>
        <Button variant="secondary" size="middle" icon="replay" iconPosition="left">
          Replay
        </Button>
      </div>
    </div>
  );
}
