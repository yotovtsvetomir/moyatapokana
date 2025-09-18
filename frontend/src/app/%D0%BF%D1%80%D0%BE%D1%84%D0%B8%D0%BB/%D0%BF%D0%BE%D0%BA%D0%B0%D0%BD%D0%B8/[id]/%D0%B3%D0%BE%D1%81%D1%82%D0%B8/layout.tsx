import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { GuestsProvider } from "@/context/GuestsContext";
import type { components } from "@/shared/types";

type PaginatedGuests = components["schemas"]["PaginatedResponse_GuestRead_"];
type RSVPWithStats = components["schemas"]["RSVPWithStats"];

interface Props {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

async function getRSVPWithStats(id: string): Promise<{ guests: PaginatedGuests; stats: RSVPWithStats["stats"] } | null> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join("; ");

    const res = await fetch(`${process.env.API_URL_SERVER}/invitations/rsvp/${id}`, {
      headers: { "Content-Type": "application/json", Cookie: cookieHeader },
      cache: "no-store",
    });

    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch RSVP:", err);
    return null;
  }
}

export default async function GuestsPage({ params, children }: Props) {
  const { id } = await params;
  const data = await getRSVPWithStats(id);
  if (!data) return notFound();

  return (
    <GuestsProvider initialData={data}>
      {children}
    </GuestsProvider>
  );
}
