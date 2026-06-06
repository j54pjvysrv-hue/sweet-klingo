import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type ChatSearch = { passage?: string; sentence?: string; word?: string };

export const Route = createFileRoute("/chat/")({
  validateSearch: (s: Record<string, unknown>): ChatSearch => ({
    passage: typeof s.passage === "string" ? s.passage : undefined,
    sentence: typeof s.sentence === "string" ? s.sentence : undefined,
    word: typeof s.word === "string" ? s.word : undefined,
  }),
  component: ChatIndex,
});

function ChatIndex() {
  const navigate = useNavigate();
  const search = Route.useSearch();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!userRes.user) {
        navigate({ to: "/auth" });
        return;
      }
      const hasContext = !!(search.passage || search.sentence || search.word);
      let threadId: string | null = null;
      if (!hasContext) {
        const { data: latest } = await supabase
          .from("chat_threads")
          .select("id")
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (cancelled) return;
        threadId = latest?.id ?? null;
      }
      if (!threadId) {
        const { data, error } = await supabase
          .from("chat_threads")
          .insert({
            user_id: userRes.user.id,
            title: hasContext ? "New conversation" : "Soyeon",
            context: hasContext ? (search as unknown as never) : null,
          })
          .select("id")
          .single();
        if (cancelled) return;
        if (error) {
          console.error("create thread failed", error);
          return;
        }
        threadId = data.id;
      }
      navigate({
        to: "/chat/$threadId",
        params: { threadId: threadId! },
        search: hasContext ? (search as never) : ({} as never),
        replace: true,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="mx-auto flex h-[60vh] max-w-3xl items-center justify-center px-5">
      <div className="text-center text-sm text-muted-foreground">
        <Sparkles className="mx-auto mb-2 h-5 w-5 text-primary" /> Opening a Soyeon thread…
      </div>
    </div>
  );
}
