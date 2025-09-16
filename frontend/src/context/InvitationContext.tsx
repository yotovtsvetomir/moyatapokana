"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { components } from "@/shared/types";

type Invitation = components["schemas"]["InvitationRead"];

interface InvitationContextType {
  invitation: Invitation | null;
  setInvitation: (invitation: Invitation) => void;
  updateInvitation: (data: Partial<Invitation>) => Promise<void>;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const InvitationContext = createContext<InvitationContextType | undefined>(undefined);

export function InvitationProvider({ children }: { children: ReactNode }) {
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(false);

  const updateInvitation = async (data: Partial<Invitation>) => {
    if (!invitation) return;

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invitations/update/${invitation.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update invitation");

      const updated = await res.json();
      setInvitation(updated);
    } finally {
      setLoading(false);
    }
  };

  return (
    <InvitationContext.Provider value={{ invitation, setInvitation, updateInvitation, loading, setLoading }}>
      {children}
    </InvitationContext.Provider>
  );
}

export function useInvitation() {
  const context = useContext(InvitationContext);
  if (!context) throw new Error("useInvitation must be used within InvitationProvider");
  return context;
}
