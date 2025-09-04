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
      invitationId: invitation.id,
      gameKey: invitation.selected_game_obj?.key ?? null,
      slideshowKey: invitation.selected_slideshow_obj?.key ?? null,
      primaryColor: invitation.primary_color ?? "",
      secondaryColor: invitation.secondary_color ?? "",
      slideshowImages: invitation.slideshow_images ?? "",
    };
    localStorage.setItem("invitationData", JSON.stringify(data));

    let target = "";
    if (invitation.selected_game_obj?.key) {
      target = `/games/${invitation.selected_game_obj.key}`;
    } else if (invitation.selected_slideshow_obj?.key) {
      target = `/slideshows/${invitation.selected_slideshow_obj.key}`;
    } else {
      target = `/invitations/preview/${invitation.id}/schedule`;
    }

    router.replace(target);
  }, [invitation, router]);

  return <p>Пренасочване...</p>;
}
