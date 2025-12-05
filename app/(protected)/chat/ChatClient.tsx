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

  // AUTO SCROLL
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  // LOAD HISTORY
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

    setMessages((prev) => prev.filter((m) => !m.content.startsWith("[{")));
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

    // STREAM RESPONSE
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

    // SAVE messages
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
    <div className="flex flex-col h-screen bg-slate-50">
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
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {tokensPerSecond && (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 font-medium">
                ⏱ {tokensPerSecond} tokens/s
              </span>
            )}
            <span className="hidden sm:inline-flex items-center rounded-full border px-3 py-1">
              Connecté
            </span>
          </div>
        </div>
      </header>

      {/* ZONE DE CHAT */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {messages.length === 0 && !streamingText && (
            <div className="h-[60vh] flex flex-col items-center justify-center text-gray-400 text-sm">
              <p className="mb-1">
                💬 Bienvenue sur Chatify AI Assistant.
              </p>
              <p>Commence par poser une question dans le champ en bas.</p>
            </div>
          )}

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
                <div className="text-[10px] uppercase tracking-wide opacity-70 mb-1">
                  {msg.role === "user" ? "Toi" : "Assistant"}
                </div>
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </div>
              </div>
            </div>
          ))}

          {streamingText && (
            <div className="mb-4 flex justify-start">
              <div className="max-w-[80%] rounded-2xl px-4 py-3 shadow-sm bg-white text-slate-900">
                <div className="text-[10px] uppercase tracking-wide opacity-70 mb-1">
                  Assistant (en train d’écrire…)
                </div>
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {streamingText}
                </div>
                <div className="text-[11px] text-gray-500 mt-2 flex items-center gap-2">
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce">•</span>
                    <span className="animate-bounce [animation-delay:0.1s]">
                      •
                    </span>
                    <span className="animate-bounce [animation-delay:0.2s]">
                      •
                    </span>
                  </span>
                  {tokensPerSecond && (
                    <span>⏱ {tokensPerSecond} tokens/s</span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      <div className="border-t bg-white">
        <div className="max-w-3xl mx-auto px-4 py-3 flex gap-2">
          <input
            className="flex-1 border border-slate-300 p-3 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-slate-50"
            placeholder="Écris ton message..."
            value={input}
            disabled={isSending}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => (e.key === "Enter" ? sendMessage() : null)}
          />

          <button
            onClick={sendMessage}
            disabled={isSending}
            className={`px-5 py-2.5 rounded-lg shadow-sm text-sm font-medium text-white flex items-center justify-center ${
              isSending
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-slate-900 hover:bg-slate-800"
            }`}
          >
            {isSending ? "..." : "Envoyer"}
          </button>
        </div>
      </div>
    </div>
  );
}
