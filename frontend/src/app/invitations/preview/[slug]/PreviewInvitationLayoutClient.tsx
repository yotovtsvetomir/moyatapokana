"use client";

import { ReactNode, useEffect, useState } from "react";
import { useInvitation } from "@/context/InvitationContext";
import { Spinner } from "@/ui-components/Spinner/Spinner";
import type { components } from "@/shared/types";

type Invitation = components["schemas"]["InvitationRead"];

interface Props {
  children: ReactNode;
  invitation: Invitation;
}

export default function PreviewInvitationLayoutClient({ children, invitation }: Props) {
  const { setInvitation } = useInvitation();
  const [localLoading, setLocalLoading] = useState(true);

  useEffect(() => {
    if (invitation) setInvitation(invitation);
    setLocalLoading(false);
  }, [invitation, setInvitation]);

  if (localLoading) return <Spinner size={60} />;

  return <>{children}</>;
}
