import "./globals.css";
import type { Metadata } from "next";
import { SupabaseProvider } from "./providers/SupabaseProvider";

export const metadata: Metadata = {
  title: "Chatify AI Assistant",
  description: "AI Chatbot",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SupabaseProvider>
          {children}
        </SupabaseProvider>
      </body>
    </html>
  );
}
