"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSupabase } from "@/app/providers/SupabaseProvider";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

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

  async function renameConversation(id: string) {
    await fetch(`/api/conversations/${id}/rename`, {
      method: "PATCH",
      body: JSON.stringify({ title: editingTitle }),
    });
    setEditingId(null);
    await load();
  }

  async function deleteConversation(id: string) {
    await fetch(`/api/conversations/${id}/delete`, {
      method: "DELETE",
    });
    await load();
  }

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
      {/* HEADER MOBILE : bouton ✖ pour fermer */}
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
          alt="Chatify AI Logo"
          width={26}
          height={26}
          className="rounded-md"
        />
        <span className="text-sm font-semibold text-slate-100 tracking-wide">
          Chatify AI
        </span>
      </div>

      {/* NOUVELLE CONVERSATION */}
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

      {/* LISTE DES CONVERSATIONS */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`flex items-center justify-between rounded-lg text-sm ${
              activeId === conv.id ? "bg-slate-800" : "hover:bg-slate-900/70"
            }`}
          >
            {editingId === conv.id ? (
              <div className="flex flex-1 gap-2 p-2">
                <input
                  className="border border-slate-600 bg-slate-900 text-slate-100 text-xs p-1 rounded flex-1"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                />
                <button onClick={() => renameConversation(conv.id)}>✔</button>
                <button onClick={() => setEditingId(null)}>✖</button>
              </div>
            ) : (
              <>
                <Link
                  href={`/chat/${conv.id}`}
                  className="p-2 flex-1 truncate text-xs text-slate-100"
                >
                  {conv.title || "Sans titre"}
                </Link>
                <button
                  onClick={() => {
                    setEditingId(conv.id);
                    setEditingTitle(conv.title);
                  }}
                  className="p-1 text-slate-400 hover:text-emerald-400"
                >
                  <PencilSquareIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteConversation(conv.id)}
                  className="p-1 text-slate-400 hover:text-red-500"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
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
