"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { Spinner } from "@/ui-components/Spinner/Spinner";
import { Button } from "@/ui-components/Button/Button";
import OverviewSection from "@/ui-components/OverviewSection/OverviewSection";
import type { components } from "@/shared/types";
import { useInvitation } from "@/context/InvitationContext";

export default function InvitationBasePage() {
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
    <div className="container fullHeight centerWrapper">
      <h1>Редакция на покана #{invitation.id}</h1>

      <OverviewSection
        href={`/invitations/edit/${id}/base/text`}
        title="Текст"
        value={invitation.title || invitation.description || invitation.extra_info ||"—"}
      />

      <OverviewSection
        href={`/invitations/edit/${id}/base/style`}
        title="Стил"
        value={invitation.primary_color || invitation.secondary_color || "—"}
        last
      />

      <OverviewSection
        href={`/invitations/edit/${id}/base/wallpaper`}
        title="Фон"
        value={invitation.wallpaper || "—"}
      />

      <div className="editActions">
        <Button
          href={`/invitations/edit/${invitation.id}/`}
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
