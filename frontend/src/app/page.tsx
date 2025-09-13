import Home from "./Home";
import { Template } from "@/shared/types";

async function getTemplates(): Promise<Template[]> {
  const res = await fetch(`${process.env.API_URL_SERVER}/home`, {
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch templates");
  }

  const templates: Template[] = await res.json();
  return templates;
}

export default async function Page() {
  const templates = await getTemplates();

  const fontLinks = Array.from(
    new Set(
      templates
        .map(t => t.font_obj?.font_url)
        .filter(Boolean) as string[]
    )
  );

  return (
    <>
      {fontLinks.map((url, i) => (
        <link key={i} rel="stylesheet" href={url} />
      ))}

      <Home templates={templates} />
    </>
  );
}
