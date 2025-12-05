# Chatify AI Assistant – Chatbot Case Study

This project was built as part of the Chatify recruitment case study.

It is a full-stack AI chatbot application with:

- **Next.js (App Router) + React + TypeScript**
- **Supabase** for authentication and PostgreSQL storage
- **Gemini** (Google Generative Language API) as the LLM
- **Tailwind CSS** for a clean, modern UI

The goal is to provide a **simple but production-like** chatbot experience:
authenticated users can create conversations, talk to an LLM in streaming, and
retrieve their chat history.

---

## ✨ Features

- 🔐 **User authentication** with Supabase (email/password)
- 💬 **Chat interface** connected to Gemini (`gemini-2.0-flash`)
- 🧠 **Persistent conversations** stored in Supabase (`conversations` + `messages`)
- 📜 **Conversation list** (create, rename, delete, resume a chat)
- ⚡ **Streaming responses** from the LLM using `ReadableStream`
- 📊 **Estimated tokens per second** displayed during streaming (bonus)
- 💻 **Responsive & clean UI** using Tailwind (dark sidebar, light chat area)

---

## 🧱 Tech Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **UI**: React + Tailwind CSS
- **Auth & DB**: Supabase (PostgreSQL + Auth)
- **LLM**: Gemini API (`gemini-2.0-flash`)
- **Styling helpers**: `@supabase/auth-ui-react`, `@supabase/auth-ui-shared`

---

## 🧩 Architecture Overview

### Routing

The app uses the **App Router** structure:

- `app/layout.tsx`  
  Wraps the whole app with `SupabaseProvider` (browser client).

- `app/page.tsx`  
  Redirects `/` → `/auth`.

- `app/(auth)/auth/page.tsx`  
  Public route.  
  Supabase Auth UI component to sign up / sign in.  
  On `SIGNED_IN` event, the user is redirected to `/chat/new`.

- `app/(protected)/chat/layout.tsx`  
  Layout for all chat routes.  
  Renders the **conversation sidebar** on the left and the selected chat page on the right.

- `app/(protected)/chat/page.tsx`  
  Redirects `/chat` → `/chat/new` (or could redirect to last conversation).

- `app/(protected)/chat/new/page.tsx`  
  Page to **create a new conversation** (title input + button).  
  After creation, redirects to `/chat/[id]`.

- `app/(protected)/chat/[id]/page.tsx`  
  Server component that:
  - Loads the current user via `getSupabaseServer()`
  - If no user → redirects to `/auth`
  - Otherwise renders `<ChatClient user={user} conversationId={id} />`

### Supabase integration

There are three helpers for Supabase:

- `lib/supabase-browser.ts`  
  Creates a browser Supabase client via `createBrowserClient`.

- `lib/supabase-server.ts`  
  Creates a server-side Supabase client with `createServerClient` + cookies, used in server components.

- `lib/supabase-route.ts`  
  Same as above, but for **route handlers** (`/api/...`), to keep auth context on API calls.

`SupabaseProvider` (in `app/providers/SupabaseProvider.tsx`) creates a React context that exposes a browser Supabase client to all client components.

### Data model

Two main tables are used in Supabase:

#### `conversations`

- `id` (UUID)
- `user_id` (UUID) – the owner of the conversation
- `title` (text)
- `updated_at` (timestamp)

Used to list a user’s conversations in the sidebar and sort them by recent activity.

#### `messages`

- `id` (UUID)
- `conversation_id` (UUID) – foreign key to `conversations`
- `user_id` (UUID)
- `role` (`'user' | 'assistant'`)
- `content` (text)
- `created_at` (timestamp)

Used to reconstruct a full chat history when opening a conversation.

### API routes

- `app/api/chat/route.ts`  
  - `POST`  
  - Body: `{ message: string, userId: string }`  
  - Calls the Gemini API (`gemini-2.0-flash:generateContent`) with the user’s message.  
  - Returns plain text and is consumed as a **stream** on the client.

- `app/api/conversations/route.ts`  
  - `POST`  
  - Reads the authenticated user from Supabase on the server.  
  - Inserts a new row in `conversations` with `user_id`, `title`.  
  - Returns `{ id }` of the created conversation.

- `app/api/conversations/[id]/rename/route.ts`  
  - `PATCH`  
  - Updates the `title` of the conversation (with user check).

- `app/api/conversations/[id]/delete/route.ts`  
  - `DELETE`  
  - Deletes a conversation by `id` (and any cascading data if configured).

---

## 🧠 Chat & Streaming

### Client-side chat logic (`ChatClient.tsx`)

- Loads historical messages for a conversation from Supabase on mount.
- When the user sends a message:
  1. Append the user message to the local state.
  2. Call `POST /api/chat` with the message & user id.
  3. Read the response as a **stream** using `res.body.getReader()`.
  4. Update a local `streamingText` state as chunks arrive.
  5. Compute an **estimated tokens/s** value during streaming.
  6. Once streaming ends, append the assistant message to the conversation.
  7. Save both the user and assistant messages to the `messages` table.
  8. Update `conversations.updated_at` for sorting in the sidebar.

---

## 📊 Tokens per second (bonus) & its limitations

During streaming, the UI displays an **estimated number of tokens per second**:

- A helper `countTokens(text)` approximates the number of tokens from the generated text.
- In `ChatClient`, at each chunk, it computes:

```ts
const elapsed = (Date.now() - start) / 1000;
const currentTokens = countTokens(fullResponse);
setTokensPerSecond((currentTokens / elapsed).toFixed(2));
