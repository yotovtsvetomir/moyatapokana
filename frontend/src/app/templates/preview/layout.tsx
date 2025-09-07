"use client";

import { ReactNode } from "react";
import { TemplateProvider } from "@/context/TemplateContext";

export default function TemplatesLayout({ children }: { children: ReactNode }) {
  return <TemplateProvider>{children}</TemplateProvider>;
}
