import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { InvitationProvider } from "@/context/InvitationContext";
import EditInvitationLayoutClient from "./EditInvitationLayoutClient";
import type { components } from "@/shared/types";

type Invitation = components["schemas"]["InvitationRead"];

async function getInvitation(id: string): Promise<Invitation | null> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join("; ");

    const res = await fetch(`${process.env.API_URL_SERVER}/invitations/${id}`, {
      headers: {
        "Content-Type": "application/json",
        "Cookie": cookieHeader,
      },
      cache: "no-store",
    });

    if (!res.ok) return null;
    return res.json();
  } catch (err) {
    console.error("Failed to fetch invitation:", err);
    return null;
  }
}

export default async function EditInvitationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  const pm = await params;
  const invitation = await getInvitation(pm.id);
  if (!invitation) return notFound();

  return (
    <InvitationProvider>
      <EditInvitationLayoutClient invitation={invitation}>
        {children}
      </EditInvitationLayoutClient>
    </InvitationProvider>
  );
}
