"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function AuthRedirectClient() {
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    let mounted = true;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!mounted) return;
      if (user) {
        router.replace("/chat/new");
      } else {
        router.replace("/auth");
      }
    });

    return () => {
      mounted = false;
    };
  }, [router]);

  return null;
}
