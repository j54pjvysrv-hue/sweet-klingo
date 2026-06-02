import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { candyLibrary, categories } from "@/lib/sweet-content";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Candy Library — Sweet" },
      { name: "description", content: "Browse thousands of bite-sized Korean reading lessons. Filter by level and topic, or generate your own." },
      { property: "og:title", content: "Candy Library — Sweet" },
      { property: "og:description", content: "Browse Korean Candy by topic and level. Generate custom stories with AI." },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const [cat, setCat] = useState<(typeof categories)[number]>("All");
  const [q, setQ] = useState("");

  const items = useMemo(
    () =>
      candyLibrary.filter((c) => {
        const matchCat = cat === "All" || c.topic === cat;
        const matchQ = q.trim() === "" || (c.title + c.blurb).toLowerCase().includes(q.toLowerCase());
        return matchCat && matchQ;
      }),
    [cat, q],
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
          Curated reading templates across daily life, K-culture, work, exam prep and
          grammar. Tell Sweet what you want and it’ll write a fresh story for you.
        </p>
      </div>

      {/* Generate prompt */}
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
        <p className="mt-2 text-xs text-muted-foreground">Demo input — wire to AI generation in the next iteration.</p>
      </div>

      {/* Filters */}
      <div className="mt-10 flex flex-wrap items-center gap-2">
        <div className="relative mr-2 w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search Candy"
            className="w-full rounded-full border border-border bg-card py-2 pl-9 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>
        {categories.map((c) => (
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
            {c}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((c) => (
          <Link
            to="/read"
            key={c.id}
            className="group rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-petal"
          >
            <div className="text-3xl">{c.emoji}</div>
            <div className="mt-3 flex items-center gap-2">
              <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">{c.level}</span>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{c.topic}</span>
            </div>
            <h3 className="mt-2 font-display text-lg font-semibold text-foreground group-hover:text-primary">{c.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{c.blurb}</p>
          </Link>
        ))}
        {items.length === 0 && (
          <p className="col-span-full rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
            No Candy matches that. Try a different topic.
          </p>
        )}
      </div>
    </div>
  );
}
