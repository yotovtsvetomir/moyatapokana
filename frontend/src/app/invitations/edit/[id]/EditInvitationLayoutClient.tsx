"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useInvitation } from "@/context/InvitationContext";
import { Spinner } from "@/ui-components/Spinner/Spinner";
import Stepper from "@/components/Stepper/Stepper";
import type { components } from "@/shared/types";

type Invitation = components["schemas"]["InvitationRead"];

interface Props {
  children: ReactNode;
  invitation: Invitation;
}

export default function EditInvitationLayoutClient({ children, invitation }: Props) {
  const router = useRouter();
  const { setInvitation } = useInvitation();
  const [localLoading, setLocalLoading] = useState(true);

  useEffect(() => {
    if (invitation) setInvitation(invitation);
    setLocalLoading(false);
  }, [invitation, setInvitation]);

  if (localLoading) return <Spinner size={60} />;

  return (
    <div style={{ marginTop: "7rem" }}>
      <Stepper />
      <div>{children}</div>
    </div>
  );
}
