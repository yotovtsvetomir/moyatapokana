'use client';

import { ReactNode, useEffect } from 'react';
import { ProfileInvitationsProvider, useProfileInvitations } from '@/context/ProfileInvitationsContext';

interface InvitationsLayoutProps {
  children: ReactNode;
}

function InvitationsLoader({ children }: { children: ReactNode }) {
  const { setInvitations, setLoading } = useProfileInvitations();

  useEffect(() => {
    const fetchInvitations = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/invitations?page=1&page_size=7`);
        const data = await res.json();
        setInvitations(data.items || []);
      } catch (err) {
        console.error('Failed to fetch invitations:', err);
        setInvitations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInvitations();
  }, [setInvitations, setLoading]);

  return <>{children}</>;
}

export default function InvitationsLayout({ children }: InvitationsLayoutProps) {
  return (
    <ProfileInvitationsProvider>
      <InvitationsLoader>{children}</InvitationsLoader>
    </ProfileInvitationsProvider>
  );
}
