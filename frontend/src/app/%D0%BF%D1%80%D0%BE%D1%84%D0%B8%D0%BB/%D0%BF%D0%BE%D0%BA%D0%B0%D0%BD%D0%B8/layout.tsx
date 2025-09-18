import type { ReactNode } from 'react';
import { ProfileInvitationsProvider } from '@/context/ProfileInvitationsContext';
import type { components } from '@/shared/types';

type Invitation = components['schemas']['InvitationRead'];

interface Props {
  children: ReactNode;
}

// --- Server-side fetch ---
async function getInvitations(): Promise<Invitation[]> {
  try {
    const res = await fetch(
      `${process.env.API_URL_SERVER}/invitations?page=1&page_size=7`,
      {
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch (err) {
    console.error('Failed to fetch invitations:', err);
    return [];
  }
}

export default async function InvitationsLayout({ children }: Props) {
  const invitations = await getInvitations();

  return (
    <ProfileInvitationsProvider initialInvitations={invitations}>
      {children}
    </ProfileInvitationsProvider>
  );
}
