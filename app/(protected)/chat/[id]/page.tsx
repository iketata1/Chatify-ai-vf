import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import ChatClient from "../ChatClient";

export default async function ChatConversationPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  return <ChatClient user={user} conversationId={id} />;
}
