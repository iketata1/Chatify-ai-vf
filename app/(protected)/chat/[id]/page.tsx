import { redirect } from "next/navigation";
import ChatClient from "../ChatClient";
import { getSupabaseServer } from "@/lib/supabase-server";

export default async function ChatConversationPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  const supabase = await getSupabaseServer();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/auth");
  }

  return (
    <ChatClient
      key={id}
      user={user}
      conversationId={id}
    />
  );
}
