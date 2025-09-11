import type { ReactNode } from "react";
import { TemplateProvider } from "@/context/TemplateContext";
import type { components } from "@/shared/types";

type Template = components["schemas"]["TemplateRead"];

interface Props {
  children: ReactNode;
  params: { slug: string };s
}

async function getTemplateBySlug(slug: string): Promise<Template | null> {
  try {

    const res = await fetch(`${process.env.API_URL_SERVER}/invitations/templates/${slug}`, {
      headers: {
        "Content-Type": "application/json"
      },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data: Template = await res.json();
    return data;
  } catch (err) {
    console.error("Failed to fetch template:", err);
    return null;
  }
}

export default async function PreviewTemplateLayout({ children, params }: Props) {
  const { slug } = await params;
  const template = await getTemplateBySlug(slug);

  return <TemplateProvider initialTemplate={template}>{children}</TemplateProvider>;
}
