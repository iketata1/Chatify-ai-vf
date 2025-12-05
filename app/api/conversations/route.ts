import { NextResponse } from "next/server";
import { getSupabaseRoute } from "@/lib/supabase-route";

export async function POST(req: Request) {
    const supabase = await getSupabaseRoute();

  // 1️ Récupérer l'user connecté
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { title } = await req.json();

  //  Insérer la conversation
  const { data, error } = await supabase
    .from("conversations")
    .insert({
      user_id: user.id,
      title: title ?? "Nouvelle conversation",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  //  Retourner l'ID
  return NextResponse.json({ id: data.id }, { status: 200 });
}
