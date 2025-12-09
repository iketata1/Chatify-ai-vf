# Chatify AI Assistant — Étude de cas Chatbot

Ce projet a été développé pour une étude de cas de recrutement. Il s'agit d'une application full-stack de chatbot IA construite avec Next.js (App Router), React et TypeScript, utilisant Supabase pour l'authentification et le stockage, et la plateforme Gemini pour la génération de texte.

## Fonctionnalités

- **Authentification utilisateur** (Supabase : email / mot de passe)
- **Interface de chat** connectée à Gemini (`gemini-2.0-flash`)
- **Conversations persistantes** (tables `conversations` et `messages`)
- **Liste de conversations** : créer, renommer, supprimer, reprendre
- **Streaming** des réponses LLM via `ReadableStream`
- **Estimation (UX) des tokens/s** pendant le streaming (méthode heuristique)
- **Interface responsive** réalisée avec Tailwind CSS

## Pile technologique

- Framework : Next.js (App Router)
- Langage : TypeScript
- UI : React + Tailwind CSS
- Auth & DB : Supabase (PostgreSQL + Auth)
- LLM : Gemini API (`gemini-2.0-flash`)
- Librairies UI : `@supabase/auth-ui-react`, `@supabase/auth-ui-shared`

## Vue d'ensemble de l'architecture

### Routage (fichiers clés)

- `app/layout.tsx` : enveloppe l'application avec `SupabaseProvider` (client navigateur)
- `app/page.tsx` : vérifie côté serveur la session Supabase ; si session présente redirige vers `/chat/new`, sinon rend `AuthRedirectClient` (client-side) qui redirige vers `/chat/new` ou `/auth`
- `app/(auth)/auth/page.tsx` : page publique avec le composant Supabase Auth
- `app/(protected)/chat/layout.tsx` : layout des routes protégées (sidebar + zone de chat)
- `app/(protected)/chat/new/page.tsx` : création d'une nouvelle conversation
- `app/(protected)/chat/[id]/page.tsx` : composeur serveur qui charge l'utilisateur et rend `ChatClient`

### Intégration Supabase

Trois helpers :

- `lib/supabase-browser.ts` — client navigateur via `createBrowserClient`
- `lib/supabase-server.ts` — client serveur via `createServerClient` (cookies)
- `lib/supabase-route.ts` — client pour les Route Handlers (`/api/...`) conservant le contexte d'auth

Le `SupabaseProvider` (dans `app/providers/SupabaseProvider.tsx`) expose le client au reste de l'app.

## Modèle de données (résumé)

### `conversations`

- `id` (UUID)
- `user_id` (UUID)
- `title` (texte)
- `updated_at` (timestamp)

### `messages`

- `id` (UUID)
- `conversation_id` (UUID)
- `user_id` (UUID)
- `role` (`user` | `assistant`)
- `content` (texte)
- `created_at` (timestamp)

## Routes API (exemples)

### `POST /api/chat`

Corps : `{ message: string, userId: string }` — appelle la génération Gemini et renvoie le texte en streaming.

### `POST /api/conversations`

Crée une conversation liée à l'utilisateur authentifié et retourne `{ id }`.

### `PATCH /api/conversations/[id]/rename`

Met à jour le titre (vérifie le propriétaire).

### `DELETE /api/conversations/[id]/delete`

Supprime la conversation (et ses messages si cascade configurée).

## Logique du chat & streaming

Le composant client `ChatClient.tsx` :

1. Charge l'historique des messages depuis Supabase lors du montage.
2. Lorsqu'un utilisateur envoie un message :
	- ajoute immédiatement le message côté client (optimistic UI),
	- appelle `POST /api/chat`, lit la réponse via `res.body.getReader()` et met à jour `streamingText` au fur et à mesure,
	- calcule une estimation heuristique des tokens/s pour l'affichage UX,
	- à la fin du streaming, ajoute le message assistant final, sauvegarde les messages en base et met à jour `conversations.updated_at`.

Remarque : la réconciliation des IDs optimistes est effectuée en place (les IDs temporaires sont remplacés par les IDs renvoyés par Supabase), évitant un rechargement complet et des lectures supplémentaires en base.

## Estimation des tokens (bonus) et limites

- `countTokens()` est une estimation basée sur les espaces (heuristique) pour affichage UX. Ce n'est pas une tokenisation exacte et n'est pas adaptée pour la facturation. Pour des mesures précises, utilisez le tokenizer du fournisseur ou les rapports d'usage serveur.
- Le point de terminaison chat utilise l'Edge runtime et implémente un timeout via `AbortController` pour garder le streaming réactif.
- Le `viewport` est exporté via `export const viewport` dans `app/layout.tsx` (exigence App Router).

