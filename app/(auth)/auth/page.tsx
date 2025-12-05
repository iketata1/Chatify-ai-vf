"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/app/providers/SupabaseProvider";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";

export default function AuthPage() {
  const supabase = useSupabase();
  const router = useRouter();

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("auth event =", event);
        if (event === "SIGNED_IN" && session) {
          router.push("/chat/new");
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [supabase, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md">
        {/* Header / “brand” */}
        <div className="mb-6 text-center">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-lg font-semibold mb-2">
            Chatify
          </div>
          <h1 className="text-2xl font-semibold text-white">
          Chatify AI Assistant
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Connecte-toi pour accéder à ton historique de conversations.
          </p>
        </div>

        {/* Carte avec le formulaire Supabase */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
          <Auth
            supabaseClient={supabase}
            providers={[]}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: "#22c55e",
                    brandAccent: "#16a34a",
                    inputBackground: "#020617",
                    inputBorder: "#1e293b",
                    inputText: "#e5e7eb",
                  },
                  radii: {
                    borderRadiusButton: "0.6rem",
                    inputBorderRadius: "0.5rem",
                  },
                },
              },
            }}
          />
        </div>
      </div>
    </div>
  );
}
