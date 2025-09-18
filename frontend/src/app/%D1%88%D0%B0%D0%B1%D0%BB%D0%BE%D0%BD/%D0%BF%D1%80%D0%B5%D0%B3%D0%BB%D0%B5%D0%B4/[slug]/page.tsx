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
      target = `/игри/${template.selected_game_obj.key}`;
      localStorage.removeItem("replay");
    } else if (alreadySeen) {
      target = `/шаблони/преглед/${template.slug}/програма`;
    } else if (template.selected_game_obj?.key) {
      target = `/игри/${template.selected_game_obj.key}`;
    } else if (template.selected_slideshow_obj?.key) {
      target = `/слайдшоута/${template.selected_slideshow_obj.key}`;
    } else {
      target = `/шаблони/преглед/${template.slug}/програма`;
    }

    router.replace(target);
  }, [template, router]);

  return <p>Пренасочване...</p>;
}
