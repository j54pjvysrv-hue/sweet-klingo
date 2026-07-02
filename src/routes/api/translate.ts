import { createFileRoute } from "@tanstack/react-router";
import { generateText } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

type Body = { sentence?: string };

function jsonError(status: number, code: string, message: string, extra?: Record<string, unknown>) {
  return new Response(
    JSON.stringify({ error: { code, message, ...extra } }),
    { status, headers: { "Content-Type": "application/json" } },
  );
}

export const Route = createFileRoute("/api/translate")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const reqId = Math.random().toString(36).slice(2, 10);
        const started = Date.now();
        const log = (msg: string, extra?: Record<string, unknown>) =>
          console.log(`[translate ${reqId}] ${msg}`, extra ?? "");

        try {
          const authHeader =
            request.headers.get("authorization") ?? request.headers.get("Authorization") ?? "";
          if (!authHeader.toLowerCase().startsWith("bearer ")) {
            log("missing bearer token");
            return jsonError(401, "missing_token", "You're signed out. Please sign in again to use translation.");
          }
          const bearer = authHeader.slice(7).trim();
          if (!bearer) {
            log("empty bearer token");
            return jsonError(401, "missing_token", "Your session token is empty. Please sign in again.");
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(bearer);
          if (userErr || !userData?.user) {
            log("token rejected", { supabaseError: userErr?.message, status: userErr?.status });
            return jsonError(401, "invalid_token", "Your session has expired. Please sign in again to translate.", {
              supabaseError: userErr?.message,
            });
          }
          const userId = userData.user.id;

          let body: Body;
          try {
            body = (await request.json()) as Body;
          } catch (e) {
            log("invalid json body", { err: (e as Error).message });
            return jsonError(400, "invalid_body", "Translation request body was malformed.");
          }
          const ko = (body?.sentence || "").trim();
          if (!ko) {
            log("empty sentence", { userId });
            return jsonError(400, "empty_sentence", "Nothing to translate — the sentence is empty.");
          }
          if (ko.length > 600) {
            log("sentence too long", { userId, len: ko.length });
            return jsonError(400, "too_long", "Sentence is too long to translate (600 char limit).");
          }

          const key = process.env.LOVABLE_API_KEY;
          if (!key) {
            log("missing LOVABLE_API_KEY");
            return jsonError(500, "server_misconfigured", "Translation service is not configured. Contact support.");
          }

          log("translating", { userId, len: ko.length });
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
            log("ok", { userId, ms: Date.now() - started, outLen: translation.length });
            if (!translation) {
              return jsonError(502, "empty_translation", "The translator returned an empty response. Please try again.");
            }
            return Response.json({ translation });
          } catch (err) {
            const e = err as { message?: string; status?: number; name?: string };
            log("gateway error", {
              userId,
              ms: Date.now() - started,
              name: e?.name,
              status: e?.status,
              message: e?.message,
            });
            const status = typeof e?.status === "number" ? e.status : 502;
            const isRate = status === 429;
            return jsonError(
              isRate ? 429 : 502,
              isRate ? "rate_limited" : "gateway_error",
              isRate
                ? "Too many translation requests right now. Please wait a moment and try again."
                : "Translation service is temporarily unavailable. Please try again.",
              { upstream: e?.message },
            );
          }
        } catch (err) {
          const e = err as Error;
          console.error(`[translate ${reqId}] unhandled`, { message: e?.message, stack: e?.stack });
          return jsonError(500, "internal_error", "Something went wrong translating. Please try again.", {
            detail: e?.message,
          });
        }
      },
    },
  },
});
