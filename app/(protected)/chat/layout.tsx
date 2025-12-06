"use client";

import { useState } from "react";
import ConversationList from "@/components/ConversationList";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(true);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <ConversationList
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <div className="flex flex-1 flex-col">
        <header className="border-b bg-white">
          <div className="flex items-center justify-between px-4 py-3 md:px-6 lg:px-8">
            <div>
              <p className="text-sm font-semibold text-slate-900">
                Chatify AI Assistant
              </p>
              <p className="text-xs text-slate-500">
                Pose une question, l’assistant te répond en temps réel.
              </p>
            </div>

            <button
              className="md:hidden rounded-lg border-2 border-slate-300 bg-white hover:bg-slate-100 active:bg-slate-200 px-3 py-2 text-slate-900 font-semibold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? "Fermer le menu de conversations" : "Ouvrir le menu de conversations"}
              aria-expanded={mobileMenuOpen}
              aria-controls="conversation-sidebar"
            >
              <span aria-hidden="true">☰</span>
            </button>
          </div>
        </header>

        <main className="flex-1 flex flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
