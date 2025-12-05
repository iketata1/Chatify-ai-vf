"use client";

import { useState } from "react";
import ConversationList from "@/components/ConversationList";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  // Toujours ouverte au début (même sur mobile)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* SIDEBAR */}
      <ConversationList
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* CONTENU (header + page) */}
      <div className="flex flex-1 flex-col bg-slate-50">
        {/* HEADER GLOBAL (hamburger ici) */}
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

            {/* Bouton pour ouvrir/fermer la sidebar sur mobile */}
            <button
              className="md:hidden p-2 text-slate-900"
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              ☰
            </button>
          </div>
        </header>

        {/* ICI on affiche /chat/new ou /chat/[id] */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
