import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { InvitationProvider } from "@/context/InvitationContext";
import PreviewInvitationLayoutClient from "./PreviewInvitationLayoutClient";
import type { components } from "@/shared/types";

type Invitation = components["schemas"]["InvitationRead"];

async function getInvitation(slug: string): Promise<Invitation | null> {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join("; ");

    const res = await fetch(`${process.env.API_URL_SERVER}/invitations/slug/${slug}`, {
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

export default async function PreviewInvitationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const pm = await params;
  const invitation = await getInvitation(pm.slug);
  if (!invitation) return notFound();

  const ogTitle = invitation.title ?? "";
  const ogDescription = invitation.description ?? "";
  const ogImage = invitation.wallpaper ?? "";
  const ogUrl = `https://www.moyatapokana.bg/invitations/preview/${pm.slug}`;

  return (
    <>
      <head>
        <title>{ogTitle}</title>
        <meta name="description" content={ogDescription} />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={ogUrl} />
      </head>

      <InvitationProvider>
        <PreviewInvitationLayoutClient invitation={invitation}>
          {children}
        </PreviewInvitationLayoutClient>
      </InvitationProvider>
    </>
  );
}
