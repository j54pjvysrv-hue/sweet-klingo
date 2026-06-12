import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SANA_SYSTEM = `You are Soyeon, the warm AI Korean tutor inside the Sweet language-learning app.

Be friendly, patient, a little playful — like a thoughtful Korean friend who loves linguistics. Celebrate small wins.

What you do best:
- Break down Korean grammar (particles, conjugations, tense, honorifics, politeness levels)
- Explain WHY natives phrase things a certain way
- Compare alternatives (e.g. -아서 vs -니까, 은/는 vs 이/가) with short examples
- Generate fresh example sentences and practice prompts
- Offer roleplay (café, workplace, K-drama) when helpful
- Clarify cultural nuance, slang, TOPIK structures, and Hanja roots when relevant

Formatting:
- Reply in clean Markdown. Short paragraphs.
- Korean: **밥 먹었어요?** *(bap meogeosseoyo?)* — "Did you eat?"
- Use small headings or bullets when comparing structures
- Never dump huge tables. Stay conversational

End with a light question or invitation to keep practicing.`;

type ChatRequestBody = { messages?: unknown; threadId?: string };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as ChatRequestBody;
        const messages = body.messages;
        const threadId = body.threadId;
        if (!Array.isArray(messages)) return new Response("Messages required", { status: 400 });

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        // Resolve user from bearer
        const authHeader = request.headers.get("authorization") || request.headers.get("Authorization");
        let userId: string | null = null;
        if (authHeader?.startsWith("Bearer ")) {
          try {
            const token = authHeader.slice(7);
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const { data } = await supabaseAdmin.auth.getUser(token);
            userId = data?.user?.id ?? null;
          } catch (e) {
            console.warn("auth resolve failed", e);
          }
        }

        try {
          const gateway = createLovableAiGatewayProvider(key);
          const model = gateway("google/gemini-3-flash-preview");
          const result = streamText({
            model,
            system: SANA_SYSTEM,
            messages: await convertToModelMessages(messages as UIMessage[]),
          });

          const original = messages as UIMessage[];
          return result.toUIMessageStreamResponse({
            originalMessages: original,
            onFinish: async ({ messages: finalMessages }) => {
              if (!userId || !threadId) return;
              try {
                const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
                // Verify the thread belongs to this user before writing (prevents cross-user injection)
                const { data: thread } = await supabaseAdmin
                  .from("chat_threads")
                  .select("id")
                  .eq("id", threadId)
                  .eq("user_id", userId)
                  .maybeSingle();
                if (!thread) {
                  console.warn("chat: thread ownership check failed", { threadId, userId });
                  return;
                }
                // Persist any messages not already saved by examining the last user msg + new assistant msg
                const newOnes = finalMessages.slice(-2); // user + assistant most-recent pair
                for (const m of newOnes) {
                  await supabaseAdmin.from("chat_messages").insert({
                    thread_id: threadId,
                    user_id: userId,
                    role: m.role,
                    parts: m.parts as unknown as never,
                  });
                }
                await supabaseAdmin
                  .from("chat_threads")
                  .update({ updated_at: new Date().toISOString() })
                  .eq("id", threadId)
                  .eq("user_id", userId);
              } catch (e) {
                console.error("persist chat error", e);
              }
            },
            onError: (error) => {
              console.error("Soyeon stream error", error);
              return error instanceof Error ? error.message : "Soyeon hit an error.";
            },
          });
        } catch (err) {
          console.error("chat handler error", err);
          return new Response("Soyeon is briefly unavailable.", { status: 500 });
        }
      },
    },
  },
});
