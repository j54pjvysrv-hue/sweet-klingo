import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { CATEGORY_LABELS, LEVELS } from "@/lib/levels";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Candy Library — Sweet" },
      { name: "description", content: "Browse Korean Candy by topic and level. Generate custom stories with AI." },
      { property: "og:title", content: "Candy Library — Sweet" },
      { property: "og:description", content: "Browse Korean Candy by topic and level. Generate custom stories with AI." },
    ],
  }),
  component: LibraryPage,
});

type Passage = {
  id: string;
  slug: string | null;
  title: string;
  level: string;
  topic: string;
  category: string;
  emoji: string | null;
  english_hint: string | null;
  reading_minutes: number | null;
};

const CATEGORIES = ["all", "daily_life", "student_life", "kdrama", "career", "topik", "culture"] as const;

function LibraryPage() {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("all");
  const [level, setLevel] = useState<"all" | "L1" | "L2" | "L3" | "L4" | "L5">("all");
  const [q, setQ] = useState("");
  const [passages, setPassages] = useState<Passage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("candy_passages")
      .select("id, slug, title, level, topic, category, emoji, english_hint, reading_minutes")
      .order("level")
      .then(({ data }) => {
        setPassages(data ?? []);
        setLoading(false);
      });
  }, []);

  const items = useMemo(
    () =>
      passages.filter((p) => {
        if (cat !== "all" && p.category !== cat) return false;
        if (level !== "all" && p.level !== level) return false;
        if (q.trim() && !(p.title + " " + p.topic + " " + (p.english_hint ?? "")).toLowerCase().includes(q.toLowerCase()))
          return false;
        return true;
      }),
    [passages, cat, level, q],
  );

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Candy Library
        </span>
        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Pick a Candy. Or invent one.
        </h1>
        <p className="mt-3 text-muted-foreground">
          Curated reading passages across daily life, K-drama, student life, career, TOPIK and culture.
          Each one is tappable, narrated, and connected to Sana.
        </p>
      </div>

      {/* Generate prompt placeholder */}
      <div className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-petal">
        <label className="text-xs font-semibold uppercase tracking-wider text-primary">Generate a custom Candy</label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            placeholder="e.g. Intermediate K-drama scene at a Han River picnic, focus on -다고 했어요"
            className="flex-1 rounded-full border border-border bg-background px-5 py-3 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-[color:var(--blossom-soft)]"
          />
          <button className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-blossom px-5 py-3 text-sm font-semibold text-primary-foreground shadow-petal hover:scale-[1.02]">
            <Sparkles className="h-4 w-4" /> Generate
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Hooks into Lovable AI generation in the next iteration.</p>
      </div>

      {/* Filters */}
      <div className="mt-10 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative mr-2 w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search Candy"
              className="w-full rounded-full border border-border bg-card py-2 pl-9 pr-4 text-sm outline-none focus:border-primary"
            />
          </div>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors " +
                (cat === c
                  ? "bg-gradient-blossom text-primary-foreground shadow-petal"
                  : "border border-border bg-card text-muted-foreground hover:text-primary")
              }
            >
              {CATEGORY_LABELS[c]}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Level</span>
          <button
            onClick={() => setLevel("all")}
            className={"rounded-full px-3 py-1 text-xs font-medium " + (level === "all" ? "bg-secondary text-primary" : "text-muted-foreground hover:text-primary")}
          >
            All
          </button>
          {LEVELS.map((l) => (
            <button
              key={l.id}
              onClick={() => setLevel(l.id)}
              className={"rounded-full px-3 py-1 text-xs font-medium " + (level === l.id ? "bg-gradient-blossom text-primary-foreground" : "border border-border bg-card text-muted-foreground hover:text-primary")}
            >
              {l.id} · {l.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl border border-border bg-card" />
            ))
          : items.map((c) => (
              <Link
                to="/read"
                search={{ passage: c.id } as never}
                key={c.id}
                className="group rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-petal"
              >
                <div className="text-3xl">{c.emoji ?? "🌸"}</div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">{c.level}</span>
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{c.topic}</span>
                  {c.reading_minutes && <span className="ml-auto text-[11px] text-muted-foreground">{c.reading_minutes} min</span>}
                </div>
                <h3 className="mt-2 font-display text-lg font-semibold text-foreground group-hover:text-primary">{c.title}</h3>
                {c.english_hint && <p className="mt-1 text-sm text-muted-foreground">{c.english_hint}</p>}
              </Link>
            ))}
        {!loading && items.length === 0 && (
          <p className="col-span-full rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
            No Candy matches that filter yet.
          </p>
        )}
      </div>
    </div>
  );
}
