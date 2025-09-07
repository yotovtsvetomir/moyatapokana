"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTemplate } from "@/context/TemplateContext";

export default function PreviewTemplateRedirect() {
  const router = useRouter();
  const { template } = useTemplate();

  useEffect(() => {
    if (!template) return;

    const data = {
      slug: template.slug,
      slideshowKey: template.selected_slideshow_obj?.key ?? null,
      primaryColor: template.primary_color ?? "",
      secondaryColor: template.secondary_color ?? "",
      slideshowImages: template.slideshow_images ?? "",
      template: true
    };
    localStorage.setItem("invitationData", JSON.stringify(data));

    const alreadySeen = false
    const isReplay = localStorage.getItem("replay") === "true";

    let target = "";

    if (isReplay && template.selected_game_obj?.key) {
      target = `/games/${template.selected_game_obj.key}`;
      localStorage.removeItem("replay");
    } else if (alreadySeen) {
      target = `/templates/preview/${template.slug}/schedule`;
    } else if (template.selected_game_obj?.key) {
      target = `/games/${template.selected_game_obj.key}`;
    } else if (template.selected_slideshow_obj?.key) {
      target = `/slideshows/${template.selected_slideshow_obj.key}`;
    } else {
      target = `/templates/preview/${template.slug}/schedule`;
    }

    router.replace(target);
  }, [template, router]);

  return <p>Пренасочване...</p>;
}
