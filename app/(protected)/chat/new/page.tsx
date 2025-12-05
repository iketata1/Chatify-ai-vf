"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewChatPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");

  async function handleCreate() {
    const res = await fetch("/api/conversations", {
      method: "POST",
      body: JSON.stringify({ title }),
    });

    const data = await res.json();
    router.push(`/chat/${data.id}`);
  }

  return (
    <div className="h-full bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-slate-900">
            Nouvelle conversation
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Donne un titre à ta conversation pour mieux organiser tes échanges avec l’assistant.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 space-y-4">
          <div className="space-y-1">
            <label
              htmlFor="title"
              className="text-xs font-medium text-slate-600 uppercase tracking-wide"
            >
              Titre de la conversation
            </label>
            <input
  id="title"
  className="
    w-full 
    border border-slate-300 
    rounded-lg 
    px-3 
    py-2 
    text-sm 
    focus:outline-none 
    focus:ring-2 
    focus:ring-emerald-500 
    focus:border-emerald-500 
    bg-slate-50 
    placeholder:text-slate-600 
    text-slate-800
  "
  placeholder="Ex : Idées de recette healthy, préparation entretien Chatify..."
  value={title}
  onChange={(e) => setTitle(e.target.value)}
/>

          </div>

          <div className="flex justify-end">
            <button
              onClick={handleCreate}
              disabled={!title.trim()}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white shadow-sm transition-colors ${
                !title.trim()
                  ? "bg-emerald-400/60 cursor-not-allowed"
                  : "bg-emerald-600 hover:bg-emerald-500"
              }`}
            >
              <span>🚀</span>
              <span>Créer et ouvrir</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
