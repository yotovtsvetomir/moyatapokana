"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Spinner } from "@/ui-components/Spinner/Spinner";
import { Button } from "@/ui-components/Button/Button";
import Modal from "@/ui-components/Modal/Modal";
import type { components } from "@/shared/types";
import { useInvitation } from "@/context/InvitationContext";
import styles from "./Events.module.css";

export default function EventsPage() {
  const { id } = useParams<{ id: string }>();
  const { invitation, setInvitation, loading, setLoading } = useInvitation();

  const [deleteEventId, setDeleteEventId] = useState<number | null>(null);

  const timelineRef = useRef<HTMLDivElement | null>(null);
  const fillRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchInvitation = async () => {
      if (invitation?.id === Number(id)) return;

      setLoading(true);
      try {
        const res = await fetch(`/api/invitations/${id}`, { credentials: "include" });
        const data: components["schemas"]["InvitationRead"] = await res.json();
        setInvitation(data);
      } catch (err) {
        console.error("Неуспешно зареждане на поканата", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [id, invitation, setInvitation, setLoading]);

  const handleDelete = async (eventId: number) => {
    if (!invitation) return;

    const updatedEvents = invitation.events.filter(e => e.id !== eventId);

    try {
      setLoading(true);
      const res = await fetch(`/api/invitations/update/${invitation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ events: updatedEvents }),
      });

      const data: components["schemas"]["InvitationRead"] = await res.json();
      setInvitation(data);
    } catch (err) {
      console.error("Грешка при изтриване на събитието", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async () => {
    if (!invitation) return;

    const newEvent = {
      title: "",
      start_datetime: new Date().toISOString(),
      finish_datetime: new Date().toISOString(),
    };

    try {
      setLoading(true);
      const res = await fetch(`/api/invitations/update/${invitation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ events: [...invitation.events, newEvent] }),
      });

      const data: components["schemas"]["InvitationRead"] = await res.json();
      setInvitation(data);
    } catch (err) {
      console.error("Грешка при добавяне на събитието", err);
    } finally {
      setLoading(false);
    }
  };

  // Timeline scroll effect
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
  }, [invitation?.events]);

  if (loading) return <Spinner size={60} />;
  if (!invitation) return <p>Не са намерени събития</p>;

  const hasEvents = invitation.events.length > 0;

  return (
    <div className="container fullHeight centerWrapper steps">
      <h1>Покана #{invitation.id} - Събития</h1>

      {!hasEvents && (
        <p style={{ fontSize: "1rem", marginBottom: "1rem" }}>
          Моля добавете поне 1 събитие.
        </p>
      )}

      {hasEvents && (
        <div className={styles.timeline} ref={timelineRef}>
          <div className={styles.timelineTrack} />
          <div className={styles.timelineFilled} ref={fillRef} />
          <ul className={styles.eventList}>
            {invitation.events.map((event, idx) => {
              const start = new Date(event.start_datetime);
              const end = event.finish_datetime ? new Date(event.finish_datetime) : null;

              const startTime = start.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit", hour12: false });
              const endTime = end ? end.toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit", hour12: false }) : "";
              const date = start.toLocaleDateString("bg-BG", { day: "2-digit", month: "numeric", year: "numeric" });

              return (
                <li key={event.id} className={styles.eventItem} data-index={idx}>
                  <div className={styles.eventCardWrapper}>
                    <div className={styles.eventCard}>
                      <div className={styles.eventInfo}>
                        <div className={styles.eventInfoInner}>
                          <div className={styles.eventInfoGroup}>
                            <div className={styles.eventInfoLabel}>
                              <span className="material-symbols-outlined">schedule</span>
                            </div>
                            <p>{startTime}{endTime ? ` - ${endTime}` : ""}</p>
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

                        <div className={styles.eventText}>
                          <h4>{event.title || `Събитие ${idx + 1}`}</h4>
                          {event.description && <p>{event.description || ""}</p>}
                        </div>
                      </div>

                      <div className={styles.sectionIcon}></div>
                    </div>

                    <div className={styles.actions}>
                      <Button
                        variant="danger"
                        onClick={() => setDeleteEventId(event.id)}
                      >
                        Изтрий
                      </Button>

                      <Button
                        variant="primary"
                        href={`/invitations/edit/${id}/events/edit/${event.id}/`}
                      >
                        Редактирай
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div style={{ margin: "1rem 0" }}>
        <Button
          variant="primary"
          width="100%"
          size="large"
          icon="add"
          iconPosition="right"
          onClick={handleAddEvent}
        >
          Добави събитие
        </Button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: "2rem" }}>
        <Button
          href={`/invitations/edit/${id}/settings`}
          variant="secondary"
          width="47%"
          size="large"
          icon="arrow_back"
          iconPosition="left"
        >
          Назад
        </Button>

        <Button
          href={`/invitations/edit/${invitation.id}/rsvp`}
          variant="primary"
          width="47%"
          size="large"
          icon="arrow_forward"
          iconPosition="right"
          disabled={!hasEvents}
        >
          Продължи
        </Button>
      </div>

      {/* Delete Modal */}
      {deleteEventId !== null && (
        <Modal
          title="Потвърдете изтриването"
          description="Наистина ли искате да изтриете това събитие?"
          confirmText="Изтрий"
          cancelText="Отказ"
          danger
          onConfirm={() => {
            handleDelete(deleteEventId);
            setDeleteEventId(null);
          }}
          onCancel={() => setDeleteEventId(null)}
        />
      )}
    </div>
  );
}
