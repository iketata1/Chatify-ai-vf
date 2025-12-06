import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function getSupabaseRoute() {
  const cookieStore = await cookies(); 

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value ?? "";
        },
        set(name: string, value: string, options?: Record<string, unknown>) {
          cookieStore.set(name, value, options as Record<string, unknown>);
        },
        remove(name: string, options?: Record<string, unknown>) {
          cookieStore.set(name, "", { ...(options ?? {}), maxAge: 0 });
        }
      }
    }
  );
}
