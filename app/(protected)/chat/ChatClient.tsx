"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSupabase } from "@/app/providers/SupabaseProvider";
import { countTokens } from "@/lib/utils/tokens";

type Message = {
  role: "user" | "assistant";
  content: string;
  id?: string;
  created_at?: string;
};

type DBMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

function generateId(): string {
  const globalCrypto = globalThis as unknown as { crypto?: { randomUUID?: () => string } };
  return globalCrypto?.crypto?.randomUUID ? globalCrypto.crypto.randomUUID() : `tmp-${Date.now()}-${Math.random()}`;
}

export default function ChatClient({
  user,
  conversationId,
}: {
  user: { id: string } | null;
  conversationId: string;
}) {
  const supabase = useSupabase();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [tokensPerSecond, setTokensPerSecond] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const lastStreamingUpdateRef = useRef<number>(0);
  const sendAbortRef = useRef<AbortController | null>(null);
  const loadInProgressRef = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const loadMessages = useCallback(async (): Promise<void> => {
    if (loadInProgressRef.current) return;
    loadInProgressRef.current = true;
    setIsLoadingMessages(true);

    const { data, error } = await supabase
      .from("messages")
      .select("id, role, content, created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(" Erreur loadMessages:", error.message);
      loadInProgressRef.current = false;
      setIsLoadingMessages(false);
      return;
    }

    if (!data || data.length === 0) {
      setMessages([]);
      loadInProgressRef.current = false;
      setIsLoadingMessages(false);
      return;
    }

    setMessages(
      data.map((m: DBMessage) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content as string,
        created_at: m.created_at,
      }))
    );
    loadInProgressRef.current = false;
    setIsLoadingMessages(false);
  }, [supabase, conversationId]);

  useEffect(() => {
    if (!conversationId) return;

    const performLoad = async () => {
      await loadMessages();
    };

    void performLoad();

    return () => {
      try {
        sendAbortRef.current?.abort();
      } catch {
      }
      sendAbortRef.current = null;
    };
  }, [conversationId, loadMessages]);

  async function sendMessage() {
    if (!input.trim() || !user || isSending) return;

    setIsSending(true);

    const userMessage: Message = { role: "user", content: input, id: generateId() };

    const nowIso = new Date().toISOString();
    setMessages((prev) => [...prev, { ...userMessage, created_at: nowIso }]);
    setInput("");

    let fullResponse = "";
    const start = Date.now();
    const controller = new AbortController();
    sendAbortRef.current = controller;

    let res: Response | null = null;
    try {
      res = await fetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          message: userMessage.content,
          userId: user.id,
          conversationId,
        }),
        signal: controller.signal,
      });
    } catch (err) {
      const error = err as { name?: string };
      if (error?.name === "AbortError") {
        setIsSending(false);
        sendAbortRef.current = null;
        return;
      }
      throw err;
    }
    if (!res || !res.body) {
      console.error(" Pas de body dans la réponse /api/chat");
      setIsSending(false);
      sendAbortRef.current = null;
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      fullResponse += chunk;

      const now = Date.now();
      if (now - lastStreamingUpdateRef.current > 100) {
        lastStreamingUpdateRef.current = now;
        setStreamingText(fullResponse);

        const elapsed = (Date.now() - start) / 1000;
        const tokens = countTokens(fullResponse);
        if (elapsed > 0) {
          setTokensPerSecond((tokens / elapsed).toFixed(2));
        }
      }
    }

    setStreamingText(fullResponse);
    const elapsed = (Date.now() - start) / 1000;
    if (elapsed > 0) {
      setTokensPerSecond((countTokens(fullResponse) / elapsed).toFixed(2));
    }

    const assistantCreatedAt = new Date().toISOString();
    const assistantId = generateId();
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: fullResponse, id: assistantId, created_at: assistantCreatedAt },
    ]);

    setStreamingText("");
    setTokensPerSecond(null);
    setIsSending(false);

    const { data: insertedData, error: insertError } = await supabase
      .from("messages")
      .insert([
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
      ])
      .select("id, role, content, created_at");

    if (insertError) {
      console.error(" Erreur insert messages:", insertError.message);
    } else if (insertedData) {
      const inserted = insertedData as DBMessage[];
      const userRow = inserted[0];
      const assistantRow = inserted[1];

      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === userMessage.id && m.role === "user") {
            return {
              ...m,
              id: userRow.id,
              created_at: userRow.created_at,
            };
          }

          if (m.id === assistantId && m.role === "assistant") {
            return {
              ...m,
              id: assistantRow.id,
              created_at: assistantRow.created_at,
            };
          }

          return m;
        })
      );
    }

    const { error: updateError } = await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    if (updateError) {
      console.error(" Erreur update conversation:", updateError.message);
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="flex-1 overflow-y-auto bg-slate-50" role="region" aria-live="polite" aria-label="Chat messages">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {isLoadingMessages ? (
            <div className="flex flex-col items-center justify-center h-full gap-4" role="status" aria-live="assertive" aria-label="Loading conversation">
              <div className="animate-spin" aria-hidden="true">
                <svg
                  className="w-8 h-8 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    opacity="0.1"
                  />
                  <path
                    d="M22 12a10 10 0 0 1-5.93 9.02"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </div>
              <p className="text-sm text-slate-500">Chargement de la conversation...</p>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div
                  key={msg.id ?? msg.created_at ?? i}
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
            </>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t bg-white">
        <div className="max-w-3xl mx-auto px-4 py-3 flex gap-2">
          <input
            className="flex-1 border-2 border-slate-300 rounded-lg px-3 py-3 text-sm
                       text-slate-900 placeholder-slate-400
                       focus:outline-none focus:ring-2 focus:ring-slate-900/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => (e.key === "Enter" ? void sendMessage() : null)}
            placeholder="Écris ton message..."
            aria-label="Message input field"
            disabled={isSending}
          />
          <button
            onClick={sendMessage}
            disabled={isSending}
            className="px-5 py-3 bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            aria-label={isSending ? "Sending message, please wait" : "Send message"}
          >
            {isSending ? "Envoi..." : "Envoyer"}
          </button>
        </div>
      </div>
    </div>
  );
}
