import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, Lock } from "lucide-react";
import { LEVELS } from "@/lib/levels";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/courses")({
  head: () => ({
    meta: [
      { title: "Courses — Sweet" },
      { name: "description", content: "Structured Korean courses from beginner to near-native." },
    ],
  }),
  component: CoursesPage,
});

type CourseRow = { id: string; slug: string; level: string; title: string; description: string | null; emoji: string | null };
type LessonRow = { id: string; course_id: string; title: string; sort_order: number; passage_id: string | null };

function CoursesPage() {
  const [profileLevel, setProfileLevel] = useState<string>("L1");
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: c }, { data: l }] = await Promise.all([
        supabase.from("profiles").select("level").single(),
        supabase.from("courses").select("id, slug, level, title, description, emoji").order("sort_order"),
        supabase.from("lessons").select("id, course_id, title, sort_order, passage_id").order("sort_order"),
      ]);
      if (p?.level) setProfileLevel(p.level);
      setCourses(c ?? []);
      setLessons(l ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return <div className="mx-auto max-w-6xl px-5 py-14 text-sm text-muted-foreground">Loading your courses…</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
      <div className="flex items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <BookOpen className="h-3.5 w-3.5" /> Your curriculum
          </span>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Courses & quests
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Each level unlocks a stack of structured lessons tied to Candy readings,
            grammar focus, and vocabulary.
          </p>
        </div>
        <Link to="/onboarding" className="hidden text-sm font-semibold text-primary hover:underline sm:block">
          Change level →
        </Link>
      </div>

      <div className="mt-10 space-y-6">
        {LEVELS.map((meta) => {
          const course = courses.find((c) => c.level === meta.id);
          const lvlLessons = course ? lessons.filter((l) => l.course_id === course.id) : [];
          const unlocked = orderOf(meta.id) <= orderOf(profileLevel) + 1;

          return (
            <div
              key={meta.id}
              className={
                "rounded-3xl border bg-card p-6 shadow-petal transition-all " +
                (meta.id === profileLevel ? "border-primary" : "border-border")
              }
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-blossom text-2xl text-primary-foreground shadow-petal">
                  {meta.emoji}
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-xl font-bold text-foreground">{meta.name}</h2>
                    {meta.id === profileLevel && (
                      <span className="rounded-full bg-gradient-blossom px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground">
                        Your level
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{course?.description ?? meta.pitch}</p>
                </div>
                {unlocked ? (
                  <Link
                    to="/courses/$levelId"
                    params={{ levelId: meta.id }}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground hover:border-primary hover:text-primary"
                  >
                    Open <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-2 text-xs font-medium text-muted-foreground">
                    <Lock className="h-3.5 w-3.5" /> Unlock by finishing earlier levels
                  </span>
                )}
              </div>

              {unlocked && lvlLessons.length > 0 && (
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {lvlLessons.slice(0, 4).map((l) => (
                    <Link
                      key={l.id}
                      to="/read"
                      search={(prev) => ({ ...prev, passage: l.passage_id ?? undefined })}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm transition-colors hover:border-primary"
                    >
                      <span className="font-medium text-foreground">{l.sort_order}. {l.title}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              )}
              {unlocked && lvlLessons.length > 4 && (
                <div className="mt-3 text-right">
                  <Link to="/courses/$levelId" params={{ levelId: meta.id }} className="text-xs font-semibold text-primary hover:underline">
                    See all {lvlLessons.length} lessons →
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function orderOf(l: string) {
  return Number(l.slice(1));
}
