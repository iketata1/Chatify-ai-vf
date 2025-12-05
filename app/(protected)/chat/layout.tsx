"use client";

import { useState } from "react";
import ConversationList from "@/components/ConversationList";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Sidebar ouverte par défaut (desktop + mobile)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(true);

  return (
    <div className="flex min-h-screen">
      {/* SIDEBAR */}
      <ConversationList
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* COLONNE PRINCIPALE */}
      <div className="flex flex-1 flex-col bg-slate-50">
        {/* HEADER GLOBAL AVEC HAMBURGER */}
        <header className="border-b bg-white">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Chatify AI Assistant
              </p>
              <p className="text-xs text-slate-500">
                Pose une question, l’assistant te répond en temps réel.
              </p>
            </div>

            {/* Bouton hamburger visible seulement sur mobile */}
            <button
              className="md:hidden p-2 text-slate-900"
              onClick={() => setMobileMenuOpen(true)}
            >
              ☰
            </button>
          </div>
        </header>

        {/* CONTENU DES PAGES /chat */}
        <main className="flex-1 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
