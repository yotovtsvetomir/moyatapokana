// context/ProfileInvitationsContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import type { components } from '@/shared/types';

type Invitation = components['schemas']['InvitationRead'];

interface ProfileInvitationsContextType {
  invitations: Invitation[];
  setInvitations: (invitations: Invitation[]) => void;
  selectedInvitation: Invitation | null;
  setSelectedInvitation: (invitation: Invitation | null) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

const ProfileInvitationsContext = createContext<ProfileInvitationsContextType | undefined>(undefined);

export function ProfileInvitationsProvider({
  children,
  initialInvitations = [],
}: { children: ReactNode; initialInvitations?: Invitation[] }) {
  const [invitations, setInvitations] = useState<Invitation[]>(initialInvitations);
  const [selectedInvitation, setSelectedInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <ProfileInvitationsContext.Provider
      value={{
        invitations,
        setInvitations,
        selectedInvitation,
        setSelectedInvitation,
        loading,
        setLoading,
      }}
    >
      {children}
    </ProfileInvitationsContext.Provider>
  );
}

export function useProfileInvitations() {
  const context = useContext(ProfileInvitationsContext);
  if (!context) throw new Error('useProfileInvitations must be used within ProfileInvitationsProvider');
  return context;
}
