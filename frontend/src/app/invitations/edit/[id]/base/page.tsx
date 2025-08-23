"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { Spinner } from "@/ui-components/Spinner/Spinner";
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
    <div className="container fullHeight">
      <h2>Преглед на поканата</h2>

      <OverviewSection
        href={`/invitations/edit/${id}/base/text`}
        title="Заглавие"
        value={invitation.title}
      />

      <OverviewSection
        href={`/invitations/edit/${id}/base/text`}
        title="Описание"
        value={invitation.description || "—"}
      />

      <OverviewSection
        href={`/invitations/edit/${id}/base/styling`}
        title="Стил"
        value={invitation.wallpaper || invitation.primary_color || invitation.secondary_color || ""}
        last
      />
    </div>
  );
}
