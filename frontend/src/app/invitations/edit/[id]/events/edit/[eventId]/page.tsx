"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Input } from "@/ui-components/Input/Input";
import { Button } from "@/ui-components/Button/Button";
import { TextLink } from "@/ui-components/TextLink/TextLink";
import DateInput from "@/ui-components/DateInput/DateInput";
import DetailSection from "@/ui-components/DetailSection/DetailSection";
import styles from "../../Events.module.css";
import { useInvitation } from "@/context/InvitationContext";
import type { components } from '@/shared/types';

export default function EditEventPage() {
  const { id, eventId } = useParams<{ id: string; eventId: string }>();
  const { invitation, setInvitation, setLoading } = useInvitation();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [locationLink, setLocationLink] = useState("");
  const [startDatetime, setStartDatetime] = useState("");
  const [finishDatetime, setFinishDatetime] = useState("");
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<{ start_datetime?: string; finish_datetime?: string }>({});

  const backHref = `/invitations/edit/${id}/events`;

  useEffect(() => {
    if (!invitation?.events?.length) return;
    const event = invitation.events.find((e) => e.id === Number(eventId));
    if (!event) return;

    setTitle(event.title || "");
    setDescription(event.description || "");
    setLocation(event.location || "");
    setLocationLink(event.location_link || "");
    setStartDatetime(event.start_datetime);
    setFinishDatetime(event.finish_datetime ?? "");
  }, [invitation, eventId]);

  const handleSave = async (): Promise<boolean> => {
    if (!invitation) return false;

    const updatedEvents = invitation.events.map((e) =>
      e.id === Number(eventId)
        ? {
            ...e,
            title,
            description,
            location,
            location_link: locationLink,
            start_datetime: startDatetime,
            finish_datetime: finishDatetime || null,
          }
        : e
    );

    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invitations/update/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ events: updatedEvents }),
      });

      const data: components["schemas"]["InvitationRead"] = await res.json();
      setInvitation(data);
      return true;
    } catch (err) {
      console.error("Error saving event:", err);
      setError("Грешка при запазване на събитието");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container fullHeight centerWrapper steps">
      <DetailSection onSave={handleSave} backHref={backHref}>
        <h1>Редактиране на събитие #{eventId}</h1>

        {/* Text */}
        <Input
          id="title"
          name="title"
          label="Заглавие"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setError("");
          }}
          error={error}
        />

        <Input
          id="description"
          name="description"
          label="Описание (незадължително)"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setError("");
          }}
          error={error}
        />

        {/* Location */}
        <div className={styles.inputGroup}>
          <Input
            id="location_name"
            name="location_name"
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setError("");
            }}
            label="Име на мястото"
            error={error}
          />
        </div>

        <div className={styles.inputGroup}>
          <Input
            id="location"
            name="location"
            type="text"
            value={locationLink}
            onChange={(e) => setLocationLink(e.target.value)}
            label="Линк към Google Maps"
            icon="event"
          />

          {locationLink && (
            <TextLink href={locationLink} external color="accent">
              Тествай линка
            </TextLink>
          )}

          <p style={{ fontSize: "0.9rem", marginTop: "1rem", color: "#555" }}>
            Отвори <strong>Google Maps</strong>, намери мястото, натисни <strong>„Споделяне“</strong> и избери <strong>„Копирай връзката“</strong>. Постави линка тук.
          </p>
          <p style={{ fontSize: "0.9rem", marginTop: "4px", color: "#555", marginBottom: "1.5rem" }}>
            Пример: https://maps.app.goo.gl/xmzEm75NBUk8qsbi6
          </p>
        </div>

        {/* Date & Time */}
        <div className={styles.inputGroup}>
          <DateInput
            id="startDate"
            value={startDatetime}
            label="Начална дата и час"
            onChange={(date) => {
              setStartDatetime(date?.toISOString() || "");
              setErrors((prev) => ({ ...prev, start_datetime: undefined }));
            }}
            error={errors.start_datetime}
          />
        </div>

        <div className={styles.inputGroup}>
          <DateInput
            id="endDate"
            value={finishDatetime}
            label="Крайна дата и час (незадължително)"
            onChange={(date) => {
              setFinishDatetime(date?.toISOString() || "");
              setErrors((prev) => ({ ...prev, finish_datetime: undefined }));
            }}
            error={errors.finish_datetime}
          />

          {finishDatetime && (
            <Button variant="primary" onClick={() => setFinishDatetime("")}>
              Без крайна дата и час
            </Button>
          )}
        </div>
      </DetailSection>
    </div>
  );
}
