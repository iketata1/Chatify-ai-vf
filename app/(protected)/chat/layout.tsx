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
      {/* Sidebar */}
      <ConversationList
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* Zone droite */}
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

            {/* Bouton hamburger mobile */}
            <button
              className="md:hidden rounded-md border border-slate-200 px-2 py-1 text-slate-900"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
            >
              ☰
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
