import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, BookOpen, Languages, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/study")({
  head: () => ({
    meta: [
      { title: "Study — Hanja, Grammar & Vocabulary | Sweet" },
      {
        name: "description",
        content:
          "Study Korean Hanja, grammar patterns, and vocabulary — 100+ entries each, searchable in Korean and English.",
      },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    tab: (["hanja", "grammar", "vocab"].includes(String(s.tab)) ? (s.tab as "hanja" | "grammar" | "vocab") : "hanja"),
  }),
  component: StudyPage,
});

type Hanja = {
  id: string;
  character: string;
  korean_reading: string;
  meaning: string;
  romanization: string | null;
  examples: Array<{ word: string; reading: string; meaning: string }> | null;
  notes: string | null;
};
type Grammar = {
  id: string;
  pattern: string;
  level: string;
  meaning: string;
  structure: string | null;
  examples: Array<{ kr: string; en: string }> | null;
  tags: string[] | null;
};
type Vocab = {
  id: string;
  korean: string;
  romanization: string | null;
  meaning: string;
  pos: string | null;
  level: string;
  topic: string | null;
  example_kr: string | null;
  example_en: string | null;
};

const TABS = [
  { id: "hanja" as const, label: "Hanja", icon: () => <span className="font-korean">漢</span> },
  { id: "grammar" as const, label: "Grammar", icon: BookOpen },
  { id: "vocab" as const, label: "Vocabulary", icon: Languages },
];

function StudyPage() {
  const { tab } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [q, setQ] = useState("");
  const [level, setLevel] = useState<"all" | "L1" | "L2" | "L3" | "L4" | "L5">("all");
  const [hanja, setHanja] = useState<Hanja[]>([]);
  const [grammar, setGrammar] = useState<Grammar[]>([]);
  const [vocab, setVocab] = useState<Vocab[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [h, g, v] = await Promise.all([
        supabase.from("hanja").select("id, character, korean_reading, meaning, romanization, examples, notes").order("korean_reading"),
        supabase.from("grammar_patterns").select("id, pattern, level, meaning, structure, examples, tags").order("level"),
        supabase.from("vocabulary").select("id, korean, romanization, meaning, pos, level, topic, example_kr, example_en").order("level"),
      ]);
      setHanja((h.data ?? []) as unknown as Hanja[]);
      setGrammar((g.data ?? []) as unknown as Grammar[]);
      setVocab((v.data ?? []) as unknown as Vocab[]);
      setLoading(false);
    })();
  }, []);

  const term = q.trim().toLowerCase();

  const filteredHanja = useMemo(
    () => hanja.filter((h) => {
      if (!term) return true;
      return (
        h.character.includes(term) ||
        h.korean_reading.toLowerCase().includes(term) ||
        h.meaning.toLowerCase().includes(term) ||
        (h.romanization ?? "").toLowerCase().includes(term)
      );
    }),
    [hanja, term],
  );

  const filteredGrammar = useMemo(
    () => grammar.filter((g) => {
      if (level !== "all" && g.level !== level) return false;
      if (!term) return true;
      return (
        g.pattern.toLowerCase().includes(term) ||
        g.meaning.toLowerCase().includes(term) ||
        (g.structure ?? "").toLowerCase().includes(term) ||
        (g.tags ?? []).some((t) => t.toLowerCase().includes(term))
      );
    }),
    [grammar, term, level],
  );

  const filteredVocab = useMemo(
    () => vocab.filter((v) => {
      if (level !== "all" && v.level !== level) return false;
      if (!term) return true;
      return (
        v.korean.includes(term) ||
        v.meaning.toLowerCase().includes(term) ||
        (v.romanization ?? "").toLowerCase().includes(term) ||
        (v.pos ?? "").toLowerCase().includes(term) ||
        (v.topic ?? "").toLowerCase().includes(term)
      );
    }),
    [vocab, term, level],
  );

  const counts = { hanja: hanja.length, grammar: grammar.length, vocab: vocab.length };

  return (
    <div className="mx-auto max-w-6xl px-5 py-12">
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Study
        </span>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Hanja, Grammar & Vocabulary
        </h1>
        <p className="mt-2 text-muted-foreground">
          One place for the building blocks of Korean — {counts.hanja} Hanja characters,
          {" "}{counts.grammar} grammar patterns, and {counts.vocab} vocabulary entries. Search in Korean or English.
        </p>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => navigate({ search: { tab: t.id }, replace: true })}
              className={
                "inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-colors " +
                (active
                  ? "bg-gradient-blossom text-primary-foreground shadow-petal"
                  : "border border-border bg-card text-muted-foreground hover:text-primary")
              }
            >
              <t.icon className="h-4 w-4" />
              {t.label}
              <span className="rounded-full bg-background/40 px-2 py-0.5 text-[10px] font-bold">
                {t.id === "hanja" ? counts.hanja : t.id === "grammar" ? counts.grammar : counts.vocab}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search + level */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={
              tab === "hanja"
                ? "Search: 學 · 학 · learning · hak"
                : tab === "grammar"
                  ? "Search: -아서 · because · reason"
                  : "Search: 사랑 · love · noun · daily"
            }
            className="w-full rounded-full border border-border bg-card py-2.5 pl-9 pr-4 text-sm outline-none focus:border-primary"
          />
        </div>
        {tab !== "hanja" && (
          <div className="flex flex-wrap items-center gap-1">
            {(["all", "L1", "L2", "L3", "L4", "L5"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={
                  "rounded-full px-3 py-1 text-xs font-medium " +
                  (level === l
                    ? "bg-gradient-blossom text-primary-foreground"
                    : "border border-border bg-card text-muted-foreground hover:text-primary")
                }
              >
                {l === "all" ? "All" : l}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <p className="mt-10 text-sm text-muted-foreground">Loading…</p>
      ) : (
        <section className="mt-8">
          {tab === "hanja" && <HanjaGrid rows={filteredHanja} />}
          {tab === "grammar" && <GrammarList rows={filteredGrammar} />}
          {tab === "vocab" && <VocabGrid rows={filteredVocab} />}
        </section>
      )}
    </div>
  );
}

function HanjaGrid({ rows }: { rows: Hanja[] }) {
  if (rows.length === 0) return <EmptyState />;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((h) => (
        <article key={h.id} className="rounded-3xl border border-border bg-card p-5 shadow-petal">
          <div className="flex items-start justify-between gap-3">
            <div className="font-korean text-5xl text-primary">{h.character}</div>
            <div className="text-right">
              <div className="font-korean text-lg font-semibold text-foreground">{h.korean_reading}</div>
              {h.romanization && <div className="text-xs text-muted-foreground">{h.romanization}</div>}
            </div>
          </div>
          <p className="mt-3 text-sm font-medium text-foreground">{h.meaning}</p>
          {h.examples && h.examples.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {h.examples.slice(0, 3).map((ex) => (
                <li key={ex.word} className="flex items-baseline gap-2 text-sm">
                  <span className="font-korean text-foreground">{ex.word}</span>
                  <span className="text-xs text-muted-foreground">{ex.reading}</span>
                  <span className="ml-auto text-xs italic text-muted-foreground">{ex.meaning}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </div>
  );
}

function GrammarList({ rows }: { rows: Grammar[] }) {
  if (rows.length === 0) return <EmptyState />;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {rows.map((g) => (
        <article key={g.id} className="rounded-2xl border border-border bg-card p-5 shadow-petal">
          <div className="flex items-center gap-2">
            <span className="font-korean text-lg font-semibold text-primary">{g.pattern}</span>
            <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
              {g.level}
            </span>
          </div>
          <p className="mt-1 text-sm font-medium text-foreground">{g.meaning}</p>
          {g.structure && (
            <p className="mt-1 font-korean text-xs text-muted-foreground">{g.structure}</p>
          )}
          {g.examples && g.examples.length > 0 && (
            <div className="mt-3 space-y-1 rounded-xl bg-background/60 p-3">
              {g.examples.slice(0, 2).map((ex, i) => (
                <div key={i} className="text-sm">
                  <div className="font-korean text-foreground">{ex.kr}</div>
                  <div className="text-xs italic text-muted-foreground">{ex.en}</div>
                </div>
              ))}
            </div>
          )}
          {g.tags && g.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {g.tags.map((t) => (
                <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-primary">{t}</span>
              ))}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

function VocabGrid({ rows }: { rows: Vocab[] }) {
  if (rows.length === 0) return <EmptyState />;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((v) => (
        <article key={v.id} className="rounded-2xl border border-border bg-card p-4 shadow-petal">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-korean text-xl font-semibold text-foreground">{v.korean}</span>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
              {v.level}
            </span>
          </div>
          {v.romanization && (
            <div className="text-xs italic text-muted-foreground">{v.romanization}</div>
          )}
          <p className="mt-1 text-sm text-foreground">{v.meaning}</p>
          <div className="mt-1 flex flex-wrap gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            {v.pos && <span>{v.pos}</span>}
            {v.topic && <span>· {v.topic}</span>}
          </div>
          {v.example_kr && (
            <div className="mt-2 rounded-lg bg-background/60 p-2 text-xs">
              <div className="font-korean text-foreground">{v.example_kr}</div>
              {v.example_en && <div className="italic text-muted-foreground">{v.example_en}</div>}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <p className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
      Nothing matched your search.
    </p>
  );
}
