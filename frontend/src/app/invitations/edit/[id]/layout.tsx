"use client";

import { ReactNode, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useInvitation } from "@/context/InvitationContext";
import { Spinner } from "@/ui-components/Spinner/Spinner";
import Stepper from "@/components/Stepper/Stepper";

export default function EditInvitationLayout({ children }: { children: ReactNode }) {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { invitation, setInvitation } = useInvitation();
  const [localLoading, setLocalLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchInvitation() {
      try {
        if (invitation && invitation.id === Number(id)) {
          setLocalLoading(false);
          return;
        }

        const res = await fetch(`/api/invitations/${id}`, { credentials: "include" });
        if (!res.ok) throw new Error("Invitation not found");

        const data = await res.json();
        if (!cancelled) setInvitation(data);
      } catch {
        if (!cancelled) router.push("/");
      } finally {
        if (!cancelled) setLocalLoading(false);
      }
    }

    fetchInvitation();

    return () => {
      cancelled = true;
    };
  }, [id, invitation, setInvitation, router]);

  if (localLoading) return <Spinner size={60} />;

  return (
    <div style={{ marginTop: "7rem" }}>
      <Stepper />
      <div>{children}</div>
    </div>
  );
}
