"use client";

import { useParams } from "next/navigation";
import { Spinner } from "@/ui-components/Spinner/Spinner";
import { Button } from "@/ui-components/Button/Button";
import OverviewSection from "@/ui-components/OverviewSection/OverviewSection";
import { useInvitation } from "@/context/InvitationContext";

export default function InvitationнастройкиPage() {
  const { id } = useParams<{ id: string }>();
  const { invitation, loading } = useInvitation();

  if (loading) return <Spinner size={60} />;
  if (!invitation) return <p>Не е намерена покана</p>;

  return (
    <div className="container fullHeight centerWrapper steps">
      <h1>Покана #{invitation.id} - Настройки</h1>

      <OverviewSection
        href={`/покани/редактиране/${id}/настройки/текст`}
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
        href={`/покани/редактиране/${id}/настройки/стил`}
        title="Стил"
        value={invitation.primary_color || invitation.secondary_color || "—"}
      />

      <OverviewSection
        href={`/покани/редактиране/${id}/настройки/шрифт`}
        title="Шрифт"
        value={invitation.font_obj?.label || "—"}
      />

      <OverviewSection
        href={`/покани/редактиране/${id}/настройки/фон`}
        title="Фон"
        value={invitation.wallpaper || "—"}
      />

      <OverviewSection
        href={`/покани/редактиране/${id}/настройки/игра`}
        title="Игра"
        value={invitation.selected_game_obj?.name || "—"}
      />

      <OverviewSection
        href={`/покани/редактиране/${id}/настройки/музика`}
        title="Музика"
        value={
          (() => {
            const audio = invitation.background_audio?.split("/").pop() || "—";
            return audio.length > 19 ? audio.slice(0, 19) + "…" : audio;
          })()
        }
      />

      <OverviewSection
        href={`/покани/редактиране/${id}/настройки/слайдшоу`}
        title="Слайдшоу"
        value={invitation.selected_slideshow_obj?.name || "—"}
        last
      />

      <div className="editActions" style={{ paddingBottom: "2rem" }}>
        <Button
          href={`/покани/редактиране/${invitation.id}/събития`}
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
