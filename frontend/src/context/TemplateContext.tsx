"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { components } from "@/shared/types";

type Template = components["schemas"]["TemplateRead"];

interface TemplateContextType {
  template: Template | null;
  setTemplate: (template: Template) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

interface ProviderProps {
  children: ReactNode;
  initialTemplate?: Template | null;
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

export function TemplateProvider({ children, initialTemplate = null }: ProviderProps) {
  const [template, setTemplate] = useState<Template | null>(initialTemplate);
  const [loading, setLoading] = useState(false);

  return (
    <TemplateContext.Provider value={{ template, setTemplate, loading, setLoading }}>
      {children}
    </TemplateContext.Provider>
  );
}

export function useTemplate() {
  const context = useContext(TemplateContext);
  if (!context) throw new Error("useTemplate must be used within TemplateProvider");
  return context;
}
