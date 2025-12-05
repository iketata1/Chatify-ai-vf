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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  // 🔥 IMPORTANT : recharger quand conversationId change
  useEffect(() => {
    if (user) loadMessages(user.id);
  }, [user, conversationId]);

  async function loadMessages(userId: string) {
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(
        data.map((m) => ({
          role: m.role,
          content: m.content,
        }))
      );
    }
  }

  async function sendMessage() {
    if (!input.trim() || !user || isSending) return;

    setIsSending(true);

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    let fullResponse = "";
    const start = Date.now();

    const res = await fetch("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        message: userMessage.content,
        userId: user.id,
      }),
    });

    if (!res.body) {
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
      const currentTokens = countTokens(fullResponse);
      setTokensPerSecond((currentTokens / elapsed).toFixed(2));
    }

    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: fullResponse },
    ]);

    setStreamingText("");
    setTokensPerSecond(null);
    setIsSending(false);

    await supabase.from("messages").insert([
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

    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    await loadMessages(user.id);
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* ZONE MESSAGES */}
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
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* INPUT BAR */}
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
