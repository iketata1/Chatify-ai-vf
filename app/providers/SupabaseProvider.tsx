"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { SupabaseClient } from "@supabase/supabase-js";

declare global {
  interface Window {
    supabase?: SupabaseClient;
  }
}

const SupabaseContext = createContext<SupabaseClient | null>(null);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState<SupabaseClient>(() => getSupabaseBrowser());


  useEffect(() => {
    if (typeof window === "undefined" || process.env.NODE_ENV !== "development") return;
    window.supabase = supabase;
    return () => {
      if (typeof window !== "undefined") {
        delete window.supabase;
      }
    };
  }, [supabase]);

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
