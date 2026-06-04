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
     {"text": "한국어 ", "info": {"romanization":"hangugeo","meaning":"Korean (language)","pos":"noun","grammar":"optional","note":"optional"}},
     {"text": "재미있어요", "info": {"romanization":"jaemiisseoyo","meaning":"is fun","pos":"verb"}},
     {"text": "."}
   ]
 ]
}

Rules:
- 6–12 sentences, each sentence is an array of tokens
- Plain punctuation tokens (period, comma, !, ?) have NO "info"
- Every content word/particle SHOULD have "info" with romanization + meaning
- Match the level: L1 = simple polite present/past; L3 = mix banmal/grammar; L5 = literary/nuanced
- Always return valid JSON, nothing else`;

export const Route = createFileRoute("/api/generate-candy")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { prompt?: string; level?: string };
          const prompt = String(body?.prompt || "").trim();
          const level = (body?.level || "L2") as "L1" | "L2" | "L3" | "L4" | "L5";
          if (!prompt) return new Response(JSON.stringify({ error: "Prompt is required" }), { status: 400, headers: { "Content-Type": "application/json" } });

          const key = process.env.LOVABLE_API_KEY;
          if (!key) return new Response(JSON.stringify({ error: "Missing LOVABLE_API_KEY" }), { status: 500, headers: { "Content-Type": "application/json" } });

          const gateway = createLovableAiGatewayProvider(key);
          const model = gateway("google/gemini-3-flash-preview");

          const userPrompt = `Target level: ${level}\nLearner request: ${prompt}\n\nReturn JSON only.`;

          const result = await generateText({
            model,
            system: SYSTEM,
            prompt: userPrompt,
          });

          let raw = result.text?.trim() || "";
          // Strip code fences if any
          raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();

          let parsed: unknown;
          try {
            parsed = JSON.parse(raw);
          } catch {
            // Try to extract first {...} block
            const m = raw.match(/\{[\s\S]*\}/);
            if (!m) throw new Error("Model did not return JSON");
            parsed = JSON.parse(m[0]);
          }

          const passage = PassageSchema.parse(parsed);

          // Insert via service role
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
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
            })
            .select("id")
            .single();

          if (error) throw new Error(error.message);

          return new Response(JSON.stringify({ id: data.id, slug }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("generate-candy error", err);
          const message = err instanceof Error ? err.message : "Generation failed";
          return new Response(JSON.stringify({ error: message }), { status: 500, headers: { "Content-Type": "application/json" } });
        }
      },
    },
  },
});
