export type ChatMessage = {
    id?: string;
    role: "user" | "assistant";
    content: string;
    created_at?: string;
  };
  