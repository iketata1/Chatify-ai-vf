"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSupabase } from "@/app/providers/SupabaseProvider";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import Image from "next/image";  

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">

          <div className="flex items-center justify-center mb-4">
            <Image
              src="/logo-chatify.png"  
              alt="Chatify Logo"
              width={64}             
              height={64}
              className="rounded-xl border border-emerald-500/20 shadow-lg"
              priority
            />
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">
            Chatify AI Assistant
          </h1>
          <p className="text-sm text-slate-400">
            Ton assistant IA personnel pour des conversations intelligentes
          </p>
        </div>

        <div className="bg-slate-900/50 backdrop-blur border border-slate-800 p-8 rounded-2xl shadow-2xl mb-6">
          <Auth
            supabaseClient={supabase}
            providers={[]}
            redirectTo={`${typeof window !== "undefined"
              ? window.location.origin
              : ""
              }/chat/new`}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: "#22c55e",
                    brandAccent: "#16a34a",
                    inputBackground: "#0f172a",
                    inputBorder: "#1e293b",
                    inputText: "#e5e7eb",
                    inputPlaceholder: "#64748b",
                    anchorTextColor: "#10b981",
                  },
                  radii: {
                    borderRadiusButton: "0.75rem",
                    inputBorderRadius: "0.625rem",
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
