import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type HanjaRow = {
  id: string;
  character: string;
  korean_reading: string;
  meaning: string;
  romanization: string | null;
  examples: Array<{ word: string; reading: string; meaning: string }> | null;
  notes: string | null;
};

export const Route = createFileRoute("/hanja")({
  head: () => ({
    meta: [
      { title: "Hanja Lookup — Sweet" },
      { name: "description", content: "Look up Hanja (한자) — character meaning, Korean reading, and example vocabulary." },
    ],
  }),
  component: HanjaPage,
});

function HanjaPage() {
  const [rows, setRows] = useState<HanjaRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("hanja")
      .select("id, character, korean_reading, meaning, romanization, examples, notes")
      .order("korean_reading")
      .then(({ data }) => {
        setRows((data ?? []) as unknown as HanjaRow[]);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (r) =>
        r.character.includes(term) ||
        r.korean_reading.toLowerCase().includes(term) ||
        r.meaning.toLowerCase().includes(term) ||
        (r.romanization ?? "").toLowerCase().includes(term),
    );
  }, [rows, q]);

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          漢字 · Hanja
        </span>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Hanja lookup
        </h1>
        <p className="mt-2 text-muted-foreground">
          The Chinese characters that quietly shape Korean vocabulary. Search by character, Korean reading,
          romanization, or English meaning.
        </p>
      </div>

      <div className="relative mt-6 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search: 學 · 학 · learning · hak"
          className="w-full rounded-full border border-border bg-card py-2.5 pl-9 pr-4 text-sm outline-none focus:border-primary"
        />
      </div>

      {loading ? (
        <p className="mt-10 text-sm text-muted-foreground">Loading Hanja…</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((h) => (
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
              {h.notes && <p className="mt-3 text-xs text-muted-foreground">{h.notes}</p>}
            </article>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
              No Hanja matched.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
