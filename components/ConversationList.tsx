"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSupabase } from "@/app/providers/SupabaseProvider";
import {
  PlusIcon,
  ArrowLeftOnRectangleIcon,
} from "@heroicons/react/24/outline";

type Conversation = {
  id: string;
  title: string;
  updated_at?: string;
};

export default function ConversationList({
  mobileMenuOpen,
  setMobileMenuOpen,
}: {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (val: boolean) => void;
}) {
  const supabase = useSupabase();
  const pathname = usePathname();
  const activeId = pathname?.split("/").pop();

  const [conversations, setConversations] = useState<Conversation[]>([]);

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("conversations")
      .select("id, title, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (data) setConversations(data as Conversation[]);
  }

  useEffect(() => {
    load();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }

  return (
    <div
      className={`
        fixed inset-y-0 left-0 z-40
        w-72 bg-slate-950 text-slate-100 border-r border-slate-900
        flex flex-col h-full
        transform transition-transform duration-300

        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}

        md:translate-x-0 md:relative md:flex
      `}
    >
      {/* HEADER MOBILE (bouton fermer) */}
      <div className="md:hidden flex justify-end p-2 border-b border-slate-800">
        <button
          onClick={() => setMobileMenuOpen(false)}
          className="text-slate-400 hover:text-white text-xl"
        >
          ✖
        </button>
      </div>

      {/* LOGO */}
      <div className="px-3 pt-5 pb-3 border-b border-slate-900 flex items-center gap-2">
        <Image
          src="/logo-chatify.png"
          width={26}
          height={26}
          alt="Chatify AI"
          className="rounded-md"
        />
        <span className="text-sm font-semibold">Chatify AI</span>
      </div>

      {/* NOUVELLE CONV */}
      <div className="px-3 pt-3 pb-2 border-b border-slate-900">
        <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase mb-2">
          Conversations
        </p>
        <Link
          href="/chat/new"
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg text-sm font-medium"
        >
          <PlusIcon className="h-4 w-4" />
          Nouvelle conversation
        </Link>
      </div>

      {/* LISTE */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {conversations.map((conv) => (
          <Link
            key={conv.id}
            href={`/chat/${conv.id}`}
            className={`block p-2 rounded-lg text-xs truncate ${
              activeId === conv.id ? "bg-slate-800" : "hover:bg-slate-900/70"
            }`}
          >
            {conv.title || "Sans titre"}
          </Link>
        ))}
      </div>

      {/* LOGOUT */}
      <div className="border-t border-slate-900 px-3 py-3">
        <button
          onClick={logout}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-red-400"
        >
          <ArrowLeftOnRectangleIcon className="h-4 w-4" />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
