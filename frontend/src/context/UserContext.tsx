"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { components } from '@/share/types.ts';

type User = components["schemas"]["UserRead"];

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
  initialUser?: User | null;
}

export function UserProvider({ children, initialUser = null }: UserProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const loading = false; // no loading since no fetch here

  // No refresh logic here, provide a dummy function to satisfy interface
  async function refreshUser() {
    // no-op or you can throw if you want to enforce server-only fetching
  }

  return (
    <UserContext.Provider value={{ user, setUser, loading, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
}
