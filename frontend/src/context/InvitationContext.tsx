"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { components } from "@/shared/types";

type Invitation = components["schemas"]["InvitationRead"];

interface InvitationContextType {
  invitation: Invitation | null;
  setInvitation: (invitation: Invitation) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const InvitationContext = createContext<InvitationContextType | undefined>(undefined);

export function InvitationProvider({ children }: { children: ReactNode }) {
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <InvitationContext.Provider value={{ invitation, setInvitation, loading, setLoading }}>
      {children}
    </InvitationContext.Provider>
  );
}

export function useInvitation() {
  const context = useContext(InvitationContext);
  if (!context) throw new Error("useInvitation must be used within InvitationProvider");
  return context;
}
