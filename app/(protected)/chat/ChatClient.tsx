"use client";

import { useEffect, useState, useRef } from "react";
import { useSupabase } from "@/app/providers/SupabaseProvider";
import { countTokens } from "@/lib/utils/tokens";
import ConversationList from "@/components/ConversationList";

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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(true);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [tokensPerSecond, setTokensPerSecond] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  useEffect(() => {
    if (user) loadMessages(user.id);
  }, [user]);

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

    if (!res.body) return;

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

    setMessages((prev) => [...prev, { role: "assistant", content: fullResponse }]);

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
    <div className="flex h-screen">

     

      {/* 👉 MAIN CHAT */}
      <div className="flex flex-col flex-1 bg-slate-50">
      <header className="border-b bg-white">
  <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
    <div>
      <p className="text-sm font-semibold text-slate-900">
        Chatify AI Assistant
      </p>
      <p className="text-xs text-slate-500">
        Pose une question, l’assistant te répond en temps réel.
      </p>
    </div>

    {/* BOUTON MOBILE */}
    <button
      className="md:hidden p-2 text-slate-900"
      onClick={() => setMobileMenuOpen(true)}
    >
      ☰
    </button>
  </div>
</header>

        <main className="flex-1 overflow-y-auto">
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
        </main>

        {/* INPUT */}
        <div className="border-t bg-white">
          <div className="max-w-3xl mx-auto px-4 py-3 flex gap-2">
            <input
              className="flex-1 border p-2 rounded"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => (e.key === "Enter" ? sendMessage() : null)}
              placeholder="Écris ton message..."
            />
            <button
              onClick={sendMessage}
              disabled={isSending}
              className="px-5 py-2 bg-slate-900 text-white rounded-lg"
            >
              Envoyer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
