import ConversationList from "@/components/ConversationList";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <aside className="w-72 border-r bg-gray-50">
        <ConversationList />
      </aside>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
