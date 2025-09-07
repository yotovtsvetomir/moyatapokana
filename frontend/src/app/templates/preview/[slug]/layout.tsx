"use client";

import { ReactNode, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTemplate } from "@/context/TemplateContext";
import { Spinner } from "@/ui-components/Spinner/Spinner";

export default function PreviewTemplateLayout({ children }: { children: ReactNode }) {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { template, setTemplate } = useTemplate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchTemplate() {
      try {
        if (template && template.slug === slug) {
          setLoading(false);
          return;
        }

        const res = await fetch(`/api/invitations/templates/${slug}`, { credentials: "include" });
        if (!res.ok) throw new Error("Template not found");

        const data = await res.json();
        if (!cancelled) setTemplate(data);
      } catch (err) {
        if (!cancelled) console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTemplate();

    return () => {
      cancelled = true;
    };
  }, [slug, template, setTemplate, router]);

  if (loading) return <Spinner size={60} />;

  return <div>{children}</div>;
}
