import { redirect } from "next/navigation";

export default async function EditInvitationPage({ params }: { params: Promise<{ id: string }>}) {
  const pm = await params
  redirect(`/invitations/edit/${pm.id}/settings`);
}
