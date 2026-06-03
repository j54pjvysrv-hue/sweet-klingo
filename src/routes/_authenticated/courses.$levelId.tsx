import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, ChevronLeft, BookOpen, Sparkles } from "lucide-react";
import { LEVELS, type Level } from "@/lib/levels";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/courses/$levelId")({
  head: () => ({
    meta: [
      { title: "Course — Sweet" },
      { name: "description", content: "Lessons for your chosen Korean level." },
    ],
  }),
  component: LevelPage,
});

type LessonRow = {
  id: string;
  title: string;
  summary: string | null;
  sort_order: number;
  grammar_focus: string | null;
  vocab_count: number | null;
  passage_id: string | null;
};

function LevelPage() {
  const { levelId } = useParams({ from: "/_authenticated/courses/$levelId" });
  const meta = LEVELS.find((l) => l.id === (levelId as Level));
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: course } = await supabase
        .from("courses")
        .select("id")
        .eq("level", levelId)
        .maybeSingle();
      if (!course) {
        setLoading(false);
        return;
      }
      const [{ data: ls }, { data: prog }] = await Promise.all([
        supabase
          .from("lessons")
          .select("id, title, summary, sort_order, grammar_focus, vocab_count, passage_id")
          .eq("course_id", course.id)
          .order("sort_order"),
        supabase.from("user_progress").select("lesson_id, completed_at").not("completed_at", "is", null),
      ]);
      setLessons(ls ?? []);
      setCompletedIds(new Set((prog ?? []).map((p) => p.lesson_id)));
      setLoading(false);
    })();
  }, [levelId]);

  if (!meta) {
    return <div className="mx-auto max-w-3xl px-5 py-14 text-sm text-muted-foreground">Unknown level.</div>;
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:py-14">
      <Link to="/courses" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary">
        <ChevronLeft className="h-4 w-4" /> All courses
      </Link>
      <div className="mt-6 rounded-3xl border border-border bg-card p-7 shadow-soft">
        <div className="flex items-start gap-4">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-blossom text-3xl text-primary-foreground shadow-petal">
            {meta.emoji}
          </span>
          <div className="flex-1">
            <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
              Level {meta.id.slice(1)}
            </span>
            <h1 className="mt-2 font-display text-2xl font-bold text-foreground sm:text-3xl">{meta.name}</h1>
            <p className="mt-1 text-sm italic text-muted-foreground">“{meta.tagline}”</p>
            <p className="mt-3 text-foreground/80">{meta.pitch}</p>
          </div>
        </div>
      </div>

      <h2 className="mt-10 font-display text-xl font-bold text-foreground">
        <BookOpen className="mr-2 inline h-5 w-5 text-primary" /> Lessons
      </h2>

      {loading ? (
        <p className="mt-4 text-sm text-muted-foreground">Loading lessons…</p>
      ) : lessons.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-border bg-card/60 p-6 text-sm text-muted-foreground">
          No lessons yet for this level. Try{" "}
          <Link to="/library" className="font-semibold text-primary hover:underline">
            generating a Candy
          </Link>{" "}
          to add one.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {lessons.map((l) => {
            const done = completedIds.has(l.id);
            return (
              <Link
                key={l.id}
                to="/read"
                search={(prev) => ({ ...prev, passage: l.passage_id ?? undefined, lesson: l.id })}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-petal"
              >
                <span
                  className={
                    "grid h-10 w-10 shrink-0 place-items-center rounded-full font-display text-sm font-bold " +
                    (done
                      ? "bg-gradient-blossom text-primary-foreground shadow-petal"
                      : "bg-secondary text-primary")
                  }
                >
                  {done ? <Sparkles className="h-4 w-4" /> : l.sort_order}
                </span>
                <div className="flex-1">
                  <h3 className="font-display text-base font-semibold text-foreground">{l.title}</h3>
                  {l.summary && <p className="mt-0.5 text-sm text-muted-foreground">{l.summary}</p>}
                  <div className="mt-1.5 flex flex-wrap gap-2 text-[11px] uppercase tracking-wider text-muted-foreground">
                    {l.grammar_focus && <span className="rounded-full bg-secondary px-2 py-0.5 text-primary">{l.grammar_focus}</span>}
                    {l.vocab_count ? <span>{l.vocab_count} vocab</span> : null}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
