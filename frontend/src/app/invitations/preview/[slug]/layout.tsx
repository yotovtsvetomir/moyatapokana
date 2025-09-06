"use client";

import { ReactNode, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useInvitation } from "@/context/InvitationContext";
import { Spinner } from "@/ui-components/Spinner/Spinner";

export default function PreviewInvitationLayout({ children }: { children: ReactNode }) {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { invitation, setInvitation } = useInvitation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchInvitation() {
      try {
        if (invitation && invitation.slug === slug) {
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/invitations/${slug}`, { credentials: "include" });
        if (!res.ok) throw new Error("Invitation not found");

        const data = await res.json();
        if (!cancelled) setInvitation(data);
      } catch {
        if (!cancelled) console.error(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchInvitation();

    return () => {
      cancelled = true;
    };
  }, [slug, invitation, setInvitation, router]);

  if (loading) return <Spinner size={60} />;

  return <div>{children}</div>;
}
