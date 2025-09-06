"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useInvitation } from "@/context/InvitationContext";

export default function PreviewRedirect() {
  const router = useRouter();
  const { invitation } = useInvitation();

  useEffect(() => {
    if (!invitation) return;

    const data = {
      slug: invitation.slug,
      gameKey: invitation.selected_game_obj?.key ?? null,
      slideshowKey: invitation.selected_slideshow_obj?.key ?? null,
      primaryColor: invitation.primary_color ?? "",
      secondaryColor: invitation.secondary_color ?? "",
      slideshowImages: invitation.slideshow_images ?? "",
    };
    localStorage.setItem("invitationData", JSON.stringify(data));

    const seenSlugs = JSON.parse(localStorage.getItem("seen_invitation_slugs") || "[]");
    const alreadySeen = seenSlugs.includes(invitation.slug);

    const isReplay = localStorage.getItem("replay") === "true";

    let target = "";

    if (isReplay && invitation.selected_game_obj?.key) {
      target = `/games/${invitation.selected_game_obj.key}`;
      localStorage.removeItem("replay");
    } else if (alreadySeen) {
      target = `/invitations/preview/${invitation.slug}/schedule`;
    } else if (invitation.selected_game_obj?.key) {
      target = `/games/${invitation.selected_game_obj.key}`;
    } else if (invitation.selected_slideshow_obj?.key) {
      target = `/slideshows/${invitation.selected_slideshow_obj.key}`;
    } else {
      target = `/invitations/preview/${invitation.slug}/schedule`;
    }

    router.replace(target);
  }, [invitation, router]);

  return <p>Пренасочване...</p>;
}
