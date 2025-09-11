"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import type { components } from "@/shared/types";

type PaginatedGuests = components["schemas"]["PaginatedResponse_GuestRead_"];
type RSVPWithStats = components["schemas"]["RSVPWithStats"];

interface GuestsContextType {
  guests: PaginatedGuests | null;
  stats: RSVPWithStats["stats"] | null;
  setData: (data: { guests: PaginatedGuests; stats: RSVPWithStats["stats"] }) => void;
}

const GuestsContext = createContext<GuestsContextType | undefined>(undefined);

export function GuestsProvider({
  children,
  initialData,
}: {
  children: ReactNode;
  initialData?: { guests: PaginatedGuests; stats: RSVPWithStats["stats"] };
}) {
  const [guests, setGuests] = useState(initialData?.guests || null);
  const [stats, setStats] = useState(initialData?.stats || null);

  const setData = (data: { guests: PaginatedGuests; stats: RSVPWithStats["stats"] }) => {
    setGuests(data.guests);
    setStats(data.stats);
  };

  return (
    <GuestsContext.Provider value={{ guests, stats, setData }}>
      {children}
    </GuestsContext.Provider>
  );
}

export function useGuests() {
  const context = useContext(GuestsContext);
  if (!context) throw new Error("useGuests must be used within GuestsProvider");
  return context;
}
