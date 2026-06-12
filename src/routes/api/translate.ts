import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type Body = { sentence?: string };

export const Route = createFileRoute("/api/translate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Require authentication to prevent anonymous abuse of LOVABLE_API_KEY
        const authHeader = request.headers.get("authorization") ?? request.headers.get("Authorization") ?? "";
        if (!authHeader.toLowerCase().startsWith("bearer ")) {
          return new Response("Unauthorized", { status: 401 });
        }
        const bearer = authHeader.slice(7);
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(bearer);
        if (userErr || !userData?.user) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { sentence } = (await request.json()) as Body;
        const ko = (sentence || "").trim();
        if (!ko) return new Response("sentence required", { status: 400 });
        if (ko.length > 600) return new Response("sentence too long", { status: 400 });

        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        try {
          const gateway = createLovableAiGatewayProvider(key);
          const model = gateway("google/gemini-2.5-flash-lite");
          const { text } = await generateText({
            model,
            system:
              "You are a Korean→English translator for a learner app. Reply with ONE natural English sentence that captures the meaning. No quotes, no explanations, no romanization, no Korean text — only the English translation.",
            prompt: `Translate to English:\n${ko}`,
          });
          const translation = (text || "").trim().replace(/^["'“”]+|["'“”]+$/g, "");
          return Response.json({ translation });
        } catch (err) {
          console.error("translate error", err);
          return new Response("translation failed", { status: 500 });
        }
      },
    },
  },
});
