// app/(protected)/chat/ChatClient.tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useSupabase } from "@/app/providers/SupabaseProvider";
import { countTokens } from "@/lib/utils/tokens";

type Message = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatClient({
  user,
  conversationId,
}: {
  user: any;
  conversationId: string;
}) {
  const supabase = useSupabase();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [tokensPerSecond, setTokensPerSecond] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // 🔽 Scroll automatique
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  // 🔽 Charge l’historique dès qu’on a user + conversationId
  useEffect(() => {
    if (!user?.id || !conversationId) return;
    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, conversationId]);

  async function loadMessages() {
    console.log("🔄 loadMessages pour conversation:", conversationId);

    const { data, error } = await supabase
      .from("messages")
      .select("role, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("❌ Erreur loadMessages:", error.message);
      return;
    }

    console.log("✅ Messages trouvés:", data);

    if (!data || data.length === 0) {
      setMessages([]);
      return;
    }

    setMessages(
      data.map((m: any) => ({
        role: m.role as "user" | "assistant",
        content: m.content as string,
      }))
    );
  }

  async function sendMessage() {
    if (!input.trim() || !user || isSending) return;

    setIsSending(true);

    const userMessage: Message = { role: "user", content: input };

    // ➜ on ajoute à l’UI
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    let fullResponse = "";
    const start = Date.now();

    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        message: userMessage.content,
        userId: user.id,
        conversationId, // 👈 on envoie aussi l’id au backend si tu veux t’en servir plus tard
      }),
    });

    if (!res.body) {
      console.error("❌ Pas de body dans la réponse /api/chat");
      setIsSending(false);
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      fullResponse += chunk;
      setStreamingText(fullResponse);

      const elapsed = (Date.now() - start) / 1000;
      const tokens = countTokens(fullResponse);
      if (elapsed > 0) {
        setTokensPerSecond((tokens / elapsed).toFixed(2));
      }
    }

    // ➜ on ajoute la réponse dans l’UI
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: fullResponse },
    ]);

    setStreamingText("");
    setTokensPerSecond(null);
    setIsSending(false);

    // 🔽 Enregistre dans la DB
    const { error: insertError } = await supabase.from("messages").insert([
      {
        conversation_id: conversationId,
        user_id: user.id,
        role: "user",
        content: userMessage.content,
      },
      {
        conversation_id: conversationId,
        user_id: user.id,
        role: "assistant",
        content: fullResponse,
      },
    ]);

    if (insertError) {
      console.error("❌ Erreur insert messages:", insertError.message);
      // Si tu vois ici "row-level security", "RLS", etc. => c’est une policy Supabase à corriger
    } else {
      console.log("✅ Messages enregistrés en DB");
    }

    // 🔽 Met à jour la conversation pour le tri
    const { error: updateError } = await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    if (updateError) {
      console.error("❌ Erreur update conversation:", updateError.message);
    }

    // 🔽 Recharge proprement depuis la DB
    await loadMessages();
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`mb-4 flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                  msg.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-white text-slate-900"
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">
                  {msg.content}
                </div>
              </div>
            </div>
          ))}

          {streamingText && (
            <div className="mb-4 flex justify-start">
              <div className="max-w-[80%] rounded-2xl px-4 py-3 shadow-sm bg-white text-slate-900">
                {streamingText}
                {tokensPerSecond && (
                  <div className="mt-2 text-[11px] text-slate-400">
                    ~{tokensPerSecond} tokens/s
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* INPUT (mobile friendly) */}
      <div className="border-t bg-white">
        <div className="max-w-3xl mx-auto px-4 py-3 flex gap-2">
          <input
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm
                       text-slate-900 placeholder-slate-400
                       focus:outline-none focus:ring-2 focus:ring-slate-900/40"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => (e.key === "Enter" ? sendMessage() : null)}
            placeholder="Écris ton message..."
          />
          <button
            onClick={sendMessage}
            disabled={isSending}
            className="px-5 py-2 bg-slate-900 text-white rounded-lg text-sm disabled:opacity-60"
          >
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}
