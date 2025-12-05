"use client";

import { useState } from "react";
import ConversationList from "@/components/ConversationList";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 👉 sidebar toujours visible par défaut
  const [mobileMenuOpen, setMobileMenuOpen] = useState(true);

  return (
    <div className="flex h-screen">
      
      {/* SIDEBAR 🚀 toujours visible */}
      <ConversationList
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* MAIN */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
