"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { Spinner } from "@/ui-components/Spinner/Spinner";
import { Button } from "@/ui-components/Button/Button";
import OverviewSection from "@/ui-components/OverviewSection/OverviewSection";
import type { components } from "@/shared/types";
import { useInvitation } from "@/context/InvitationContext";

export default function EffectsPage() {
  const { id } = useParams<{ id: string }>();
  const { invitation, setInvitation, loading, setLoading } = useInvitation();

  useEffect(() => {
    const fetchInvitation = async () => {
      if (invitation?.id === Number(id)) return;

      setLoading(true);
      try {
        const res = await fetch(`/api/invitations?id=${id}`, { credentials: "include" });
        const data: components["schemas"]["InvitationRead"] = await res.json();
        setInvitation(data);
      } catch (err) {
        console.error("Неуспешно зареждане на ефектите", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [id, invitation, setInvitation, setLoading]);

  if (loading) return <Spinner size={60} />;
  if (!invitation) return <p>Не са намерени ефекти</p>;

  return (
    <div className="container fullHeight centerWrapper">
      <h1>Редакция на покана #{invitation.id}</h1>

      <OverviewSection
        href={`/invitations/edit/${id}/effects/game`}
        title="Игра"
        value={invitation.game_effect || "—"}
      />

      <OverviewSection
        href={`/invitations/edit/${id}/effects/music`}
        title="Музика"
        value={invitation.music_effect || "—"}
      />

      <OverviewSection
        href={`/invitations/edit/${id}/effects/slideshow`}
        title="Слайдшоу"
        value={invitation.slideshow_effect || "—"}
        last
      />

      <div className="editActions">
        <Button
          variant="secondary"
          width="47%"
          size="large"
          href={`/invitations/edit/${id}/base`}
          icon="arrow_back"
          iconPosition="left"
        >
          Назад
        </Button>

        <Button
          href={`/invitations/edit/${id}/events`}
          variant="primary"
          width="47%"
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
