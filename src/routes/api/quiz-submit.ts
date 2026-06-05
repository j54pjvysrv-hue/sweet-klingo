import { createFileRoute } from "@tanstack/react-router";

type Body = { score?: number; total?: number; suggested_level?: string; answers?: unknown };

export const Route = createFileRoute("/api/quiz-submit")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const json = (b: object, s = 200) =>
          new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });
        try {
          const auth = request.headers.get("authorization") ?? "";
          if (!auth.toLowerCase().startsWith("bearer ")) return json({ error: "Unauthorized" }, 401);
          const token = auth.slice(7);
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data: u, error: ue } = await supabaseAdmin.auth.getUser(token);
          if (ue || !u?.user) return json({ error: "Unauthorized" }, 401);

          const body = (await request.json()) as Body;
          const score = Math.max(0, Math.min(20, Number(body.score ?? 0)));
          const total = Math.max(1, Math.min(20, Number(body.total ?? 10)));
          const level = ["L1", "L2", "L3", "L4", "L5"].includes(String(body.suggested_level || ""))
            ? (body.suggested_level as string)
            : "L1";

          const { error } = await supabaseAdmin.from("quiz_results").insert({
            user_id: u.user.id,
            score,
            total,
            suggested_level: level as "L1" | "L2" | "L3" | "L4" | "L5",
            answers: (body.answers ?? {}) as never,
          });
          if (error) {
            console.error("quiz-submit insert:", error);
            return json({ error: "Could not save quiz." }, 500);
          }
          return json({ ok: true, suggested_level: level });
        } catch (e) {
          console.error("quiz-submit:", e);
          return json({ error: "Could not save quiz." }, 500);
        }
      },
    },
  },
});
