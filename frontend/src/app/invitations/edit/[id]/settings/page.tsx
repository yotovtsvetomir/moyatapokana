"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { Spinner } from "@/ui-components/Spinner/Spinner";
import { Button } from "@/ui-components/Button/Button";
import OverviewSection from "@/ui-components/OverviewSection/OverviewSection";
import type { components } from "@/shared/types";
import { useInvitation } from "@/context/InvitationContext";

export default function InvitationSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const { invitation, setInvitation, loading, setLoading } = useInvitation();

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

  if (loading) return <Spinner size={60} />;
  if (!invitation) return <p>Не е намерена покана</p>;

  return (
    <div className="container fullHeight centerWrapper steps">
      <h1>Покана #{invitation.id} - Настройки</h1>

      <OverviewSection
        href={`/invitations/edit/${id}/settings/text`}
        title="Текст"
        value={
          invitation.title
            ? invitation.title.length > 19
              ? invitation.title.slice(0, 19) + "…"
              : invitation.title
            : "—"
        }
      />

      <OverviewSection
        href={`/invitations/edit/${id}/settings/style`}
        title="Стил"
        value={invitation.primary_color || invitation.secondary_color || "—"}
      />

      <OverviewSection
        href={`/invitations/edit/${id}/settings/font`}
        title="Шрифт"
        value={invitation.font_obj?.label || "—"}
      />

      <OverviewSection
        href={`/invitations/edit/${id}/settings/wallpaper`}
        title="Фон"
        value={invitation.wallpaper || "—"}
      />

      <OverviewSection
        href={`/invitations/edit/${id}/settings/game`}
        title="Игра"
        value={invitation.selected_game_obj?.name || "—"}
      />

      <OverviewSection
        href={`/invitations/edit/${id}/settings/music`}
        title="Музика"
        value={
          (() => {
            const audio = invitation.background_audio?.split("/").pop() || "—";
            return audio.length > 19 ? audio.slice(0, 19) + "…" : audio;
          })()
        }
      />

      <OverviewSection
        href={`/invitations/edit/${id}/settings/slideshow`}
        title="Слайдшоу"
        value={invitation.selected_slideshow_obj?.name || "—"}
        last
      />

      <div className="editActions" style={{ paddingBottom: "2rem" }}>
        <Button
          href={`/invitations/edit/${invitation.id}/events`}
          variant="primary"
          width="100%"
          size="large"
          icon="arrow_forward"
          iconPosition="right"
        >
          Продължи
        </Button>
      </div>
    </div>
  );
}
