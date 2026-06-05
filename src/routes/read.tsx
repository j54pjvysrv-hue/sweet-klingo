import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft } from "lucide-react";
import { CandyReader, type Passage, type Token } from "@/components/candy-reader";
import { cafePassage } from "@/lib/sweet-content";
import { supabase } from "@/integrations/supabase/client";

type ReadSearch = { passage?: string; lesson?: string };

export const Route = createFileRoute("/read")({
  validateSearch: (search: Record<string, unknown>): ReadSearch => ({
    passage: typeof search.passage === "string" ? search.passage : undefined,
    lesson: typeof search.lesson === "string" ? search.lesson : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Candy Reader — Sweet" },
      { name: "description", content: "Read real Korean with instant tooltips for grammar, particles, conjugations, and nuance." },
      { property: "og:title", content: "Candy Reader — Sweet" },
      { property: "og:description", content: "Tap any Korean word for an instant AI breakdown." },
    ],
  }),
  component: ReadPage,
});

function ReadPage() {
  const { passage: passageId } = Route.useSearch();
  const [passage, setPassage] = useState<Passage>(cafePassage);
  const [loading, setLoading] = useState(!!passageId);

  useEffect(() => {
    if (!passageId) return;
    setLoading(true);
    supabase
      .from("candy_passages")
      .select("id, title, level, topic, english_hint, body")
      .eq("id", passageId)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const body = data.body as { lines: Token[][] };
          setPassage({
            id: data.id,
            title: data.title,
            level: data.level,
            topic: data.topic,
            englishHint: data.english_hint ?? undefined,
            lines: body.lines ?? [],
          });
        }
        setLoading(false);
      });
  }, [passageId]);

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
      <Link to="/library" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary">
        <ChevronLeft className="h-4 w-4" /> Back to library
      </Link>
      <div className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-10">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading passage…</p>
        ) : (
          <CandyReader passage={passage} />
        )}
      </div>
      <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/60 p-5 text-sm text-muted-foreground">
        <p>
          <span className="font-semibold text-primary">Regenerative Review™ tip:</span> the
          words you tap quietly return inside future Candy lessons — review through stories.
        </p>
      </div>
      <div className="mt-6 flex justify-end">
        <Link
          to="/chat"
          search={{ passage: passage.id } as never}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-blossom px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-petal hover:scale-[1.02]"
        >
          Ask Soyeon about this passage <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
