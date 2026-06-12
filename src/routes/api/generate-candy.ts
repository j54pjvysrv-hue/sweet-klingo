import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const TokenSchema = z.object({
  text: z.string(),
  info: z
    .object({
      romanization: z.string(),
      meaning: z.string(),
      pos: z.string().optional().nullable(),
      grammar: z.string().optional().nullable(),
      note: z.string().optional().nullable(),
      pattern: z.string().optional().nullable(),
      pattern_examples: z.array(z.object({ ko: z.string(), en: z.string() })).optional().nullable(),
    })
    .optional()
    .nullable(),
});

const PassageSchema = z.object({
  title: z.string(),
  level: z.enum(["L1", "L2", "L3", "L4", "L5"]),
  category: z.enum(["daily_life", "student_life", "kdrama", "career", "topik", "culture"]),
  topic: z.string(),
  emoji: z.string(),
  english_hint: z.string(),
  lines: z.array(z.array(TokenSchema)).min(4),
});

const SYSTEM = `You write short Korean reading passages for the Sweet language-learning app.

Output ONLY JSON matching this shape — no prose, no code fences:
{
 "title": "Korean title",
 "level": "L1|L2|L3|L4|L5",
 "category": "daily_life|student_life|kdrama|career|topik|culture",
 "topic": "short topic label",
 "emoji": "single emoji",
 "english_hint": "one sentence in English",
 "lines": [
   [
     {"text": "한국어 ", "info": {"romanization":"hangugeo","meaning":"Korean (language)","pos":"noun"}},
     {"text": "재미있어요", "info": {"romanization":"jaemiisseoyo","meaning":"is fun","pos":"adjective","grammar":"-아요 polite present","pattern":"-아요/어요","pattern_examples":[{"ko":"맛있어요","en":"It is delicious"},{"ko":"좋아요","en":"It is good"}]}},
     {"text": "."}
   ]
 ]
}

Rules:
- 6–12 sentences, each sentence is an array of tokens
- Plain punctuation tokens (period, comma, !, ?) have NO "info"
- Every content word/particle SHOULD have "info" with romanization + meaning
- When a word demonstrates a key grammar pattern, include "pattern" (e.g. "-아서/어서", "-(으)면", "-고 있다") and 2 "pattern_examples"
- Match the level: L1 = simple polite present/past; L3 = mix banmal/grammar; L5 = literary/nuanced
- Always return valid JSON, nothing else`;

async function attemptGeneration(prompt: string, level: string, apiKey: string) {
  const gateway = createLovableAiGatewayProvider(apiKey);
  const model = gateway("google/gemini-3-flash-preview");
  const userPrompt = `Target level: ${level}\nLearner request: ${prompt}\n\nReturn JSON only.`;

  const result = await generateText({ model, system: SYSTEM, prompt: userPrompt });

  let raw = result.text?.trim() || "";
  raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) throw new Error("Model did not return JSON");
    parsed = JSON.parse(m[0]);
  }

  return PassageSchema.parse(parsed);
}

export const Route = createFileRoute("/api/generate-candy")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const json = (body: object, status = 200) =>
          new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

        try {
          // Require authentication to prevent anonymous abuse of LOVABLE_API_KEY
          const authHeader = request.headers.get("authorization") ?? "";
          if (!authHeader.toLowerCase().startsWith("bearer ")) {
            return json({ error: "Please sign in to generate Candy." }, 401);
          }
          const bearer = authHeader.slice(7);
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(bearer);
          if (userErr || !userData?.user) {
            return json({ error: "Your session has expired. Please sign in again." }, 401);
          }

          const body = (await request.json()) as { prompt?: string; level?: string };
          const prompt = String(body?.prompt || "").trim();
          const level = (body?.level || "L2") as "L1" | "L2" | "L3" | "L4" | "L5";
          if (!prompt) return json({ error: "Please describe what you'd like to read about." }, 400);
          if (prompt.length > 500) return json({ error: "Prompt is too long (keep it under 500 characters)." }, 400);

          const key = process.env.LOVABLE_API_KEY;
          if (!key) return json({ error: "AI service is not configured. Please contact support." }, 500);

          // Retry up to 3 times on transient/parse errors
          let passage: z.infer<typeof PassageSchema> | null = null;
          let lastError: unknown = null;
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              passage = await attemptGeneration(prompt, level, key);
              break;
            } catch (e) {
              lastError = e;
              console.warn(`generate-candy attempt ${attempt} failed:`, e instanceof Error ? e.message : e);
              if (attempt < 3) await new Promise((r) => setTimeout(r, 600 * attempt));
            }
          }

          if (!passage) {
            const msg = lastError instanceof Error ? lastError.message : "Generation failed";
            // Categorise common errors
            if (/rate|429|quota/i.test(msg))
              return json({ error: "Soyeon is busy right now — please try again in a moment." }, 429);
            if (/payment|402|credits/i.test(msg))
              return json({ error: "AI credits exhausted. Please add credits in Lovable Cloud." }, 402);
            if (/JSON|parse|schema|validation/i.test(msg))
              return json({ error: "Couldn't format that into a Candy. Try a clearer topic (e.g. 'Café small talk, focus on -아요')." }, 422);
            console.error("generate-candy give-up:", msg);
            return json({ error: "Generation failed. Please try again." }, 500);
          }

          const slug = `gen-${Date.now().toString(36)}`;
          const { data, error } = await supabaseAdmin
            .from("candy_passages")
            .insert({
              slug,
              title: passage.title,
              level: passage.level,
              category: passage.category,
              topic: passage.topic,
              emoji: passage.emoji,
              english_hint: passage.english_hint,
              reading_minutes: Math.max(2, Math.round(passage.lines.length * 0.6)),
              body: { lines: passage.lines },
              generated_by: "ai",
              generated_by_user_id: userData.user.id,
            })
            .select("id")
            .single();

          if (error) {
            console.error("generate-candy insert error", error);
            return json({ error: "Could not save your Candy. Please try again." }, 500);
          }

          return json({ id: data.id, slug }, 200);
        } catch (err) {
          console.error("generate-candy fatal:", err);
          return new Response(JSON.stringify({ error: "Generation failed. Please try again." }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
