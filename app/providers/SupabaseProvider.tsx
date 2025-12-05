"use client";

import { createContext, useContext, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { SupabaseClient } from "@supabase/supabase-js";

const SupabaseContext = createContext<SupabaseClient | null>(null);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState<SupabaseClient>(() => getSupabaseBrowser());

  if (typeof window !== "undefined") {
    // @ts-ignore
    window.supabase = supabase;
  }

  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const ctx = useContext(SupabaseContext);
  if (!ctx) {
    throw new Error("SupabaseProvider manquant");
  }
  return ctx;
}
