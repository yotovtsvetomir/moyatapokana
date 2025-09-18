import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditInvitationPage({ params }: Props) {
  const pm = await params;
  redirect(`/покани/редактиране/${pm.id}/настройки`);
}
