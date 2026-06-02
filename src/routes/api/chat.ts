import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SANA_SYSTEM = `You are Sana, the warm, encouraging AI Korean tutor inside the Sweet language-learning app.

Personality: friendly, patient, a little playful — like a thoughtful Korean friend who happens to be a brilliant linguist. Use the learner's name if they share it. Celebrate small wins.

What you do best:
- Break down Korean grammar (particles, verb conjugations, tense, honorifics, politeness levels).
- Explain WHY a native speaker would phrase something a certain way, not just what it means.
- Compare alternatives (e.g. -아서 vs -니까, 은/는 vs 이/가) with short, real examples.
- Generate fresh example sentences and short practice prompts when helpful.
- Offer roleplay (café, workplace, K-drama scene) when a learner wants to practice.
- Clarify cultural nuance, slang, and TOPIK-style structures.

Formatting:
- Reply in clean Markdown. Keep paragraphs short.
- When you show Korean, follow it with a romanization in parentheses and a natural English gloss, e.g. **밥 먹었어요?** *(bap meogeosseoyo?)* — "Did you eat?"
- Use small headings or bullet lists when comparing structures.
- Never dump huge tables. Stay conversational.

If a learner pastes Korean, gently break it down: meaning, key grammar, and one tip. Always end with a light question or invitation to keep practicing.`;

type ChatRequestBody = { messages?: unknown };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as ChatRequestBody;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        try {
          const gateway = createLovableAiGatewayProvider(key);
          const model = gateway("google/gemini-3-flash-preview");
          const result = streamText({
            model,
            system: SANA_SYSTEM,
            messages: await convertToModelMessages(messages as UIMessage[]),
          });

          return result.toUIMessageStreamResponse({
            originalMessages: messages as UIMessage[],
            onError: (error) => {
              console.error("Sana chat stream error", error);
              if (error instanceof Error) return error.message;
              return "Sana hit an unexpected error. Please try again.";
            },
          });
        } catch (err) {
          console.error("Sana chat handler error", err);
          return new Response("Sana is briefly unavailable. Please try again.", { status: 500 });
        }
      },
    },
  },
});
