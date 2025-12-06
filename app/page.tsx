import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import AuthRedirectClient from "./AuthRedirectClient";

export default async function Home() {
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      redirect("/chat/new");
    }
  } catch {
  }

  return <AuthRedirectClient />;
}
