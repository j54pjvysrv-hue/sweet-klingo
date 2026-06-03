# Sweet — Full Ecosystem Build Plan

This is a very large scope. I'll ship it in 4 phases so each phase is reviewable and the app stays working between them. After you approve, I'll start with Phase 1 and check in before moving on.

## Phase 1 — Foundations (level selection, auth, data model)

- Enable Lovable Cloud (Postgres + auth).
- Auth: email/password + Google login, `/auth` page, `_authenticated` layout.
- Onboarding `/onboarding`: 5-level picker (Beginner → Near-Native) with descriptive cards and a "Help me choose" mini AI placement quiz powered by Lovable AI.
- DB tables: `profiles` (level, streak, goals), `vocab_saved`, `notes`, `chat_threads`, `chat_messages`, `candy_passages`, `lessons`, `courses`, `user_progress`, `user_roles` (+ RLS + GRANTs).
- Seed: 5 levels → courses → ~10 starter lessons each (50+ total), each linked to a Candy passage stub.

## Phase 2 — Candy Reader v2 (immersive reading)

- Sentence-by-sentence focus mode with prev/next, smooth fades, progress bar, keyboard arrows.
- Reading settings drawer: text size, line spacing, translation mode (Korean only / Korean+EN / tap to reveal), audio speed.
- Side-by-side and overlay translation modes; swipe between.
- Tap-to-learn vocabulary card (accessible dialog): meaning, romanization, POS, examples, Hanja (if any), Save / Note. Web Speech API for narration.
- Adaptive highlighting density per user level.
- "Generate new Candy" server fn: Lovable AI generates a long multi-paragraph passage on a chosen topic, persists tokens+translations to `candy_passages`, renders in Candy hub.
- Seed 50+ topic passages across Student life, TOPIK, Daily life, K-drama, Career, Culture.

## Phase 3 — Sana (AI tutor) + Hanja + Search

- Rename/keep Sana as the central tutor. `/chat` thread list + per-thread routes (`/chat/$threadId`), persisted via DB. Built with AI Elements (Conversation, Message, PromptInput, Shimmer, Tool).
- Context-aware: "Ask Sana about this sentence/word" from Candy passes selected token + passage context into the chat.
- Sana tools (AI SDK tool calling): `lookupVocab`, `explainGrammar`, `lookupHanja`, `findLessons`, `generatePractice`.
- Hanja section `/hanja`: search by character/word, origin, meaning breakdown, related vocabulary; linked from tooltips.
- Global search `/search` + header search bar (Cmd/Ctrl-K): unified results across lessons, vocabulary, grammar topics, Hanja, Candy passages, saved notes. Korean+English, debounced, keyboard nav, recent searches.

## Phase 4 — Courses, Progress, Motivation, Polish

- Courses hub `/courses` + `/courses/$levelId` + `/courses/$levelId/$lessonId` with quest-style chapter progression, checkpoints, unlocks tied to user level.
- Home `/`: progress overview, daily streak, reading goal ring, achievement badges (flower/seasonal), continue-learning cards that deep-link to the right lesson.
- Dynamic lesson generation: server fn that, on demand, generates a new lesson scoped to user's level + recent vocab, saves to `lessons`, auto-maps to current level.
- Motivation: streak celebration animation, gentle badges, no shame copy.
- Production polish: mobile overlap fixes, loading/empty/error states across all routes, focus-trap + ARIA in tap-to-learn dialog and search, full keyboard support, dark mode review.

## Technical notes (for reference)

- Stack: TanStack Start, Tailwind v4, Lovable Cloud (Supabase), Lovable AI Gateway (`google/gemini-3-flash-preview`), AI SDK + AI Elements.
- All AI calls server-side via `createServerFn` or `src/routes/api/chat.ts`.
- Chat: threaded + DB persistence (per chat-agent contract).
- Design language preserved: Cherry Blossom palette, Sora/Manrope, rounded cards, soft shadows, petals, gentle motion.

## What I need from you

1. **Approve the phased approach** (or tell me to compress / drop phases).
2. **Confirm auth**: email+password and Google sign-in? (default)
3. **Tutor name**: stick with **Sana**, switch to **Soyeon**, or keep both as aliases? Your brief uses both.

Once you reply I'll enable Lovable Cloud and start Phase 1.
