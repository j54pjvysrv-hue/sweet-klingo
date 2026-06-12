import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { BookOpen, Bookmark, MessagesSquare, Search, Sparkles } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";

type Result =
  | { kind: "candy"; id: string; title: string; level: string }
  | { kind: "hanja"; id: string; character: string; reading: string; meaning: string }
  | { kind: "grammar"; id: string; pattern: string; meaning: string; level: string }
  | { kind: "vocab"; id: string; korean: string; meaning: string; level: string }
  | { kind: "lesson"; id: string; title: string; level: string; passage_id: string | null };

export function GlobalSearch({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const term = q.trim();
    if (!term) { setResults([]); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      const pattern = `%${term}%`;
      const [candy, hanja, grammar, vocab, lessons] = await Promise.all([
        supabase
          .from("candy_passages")
          .select("id, title, level, topic, english_hint")
          .or(`title.ilike.${pattern},topic.ilike.${pattern},english_hint.ilike.${pattern}`)
          .limit(6),
        supabase
          .from("hanja")
          .select("id, character, korean_reading, meaning, romanization")
          .or(`character.ilike.${pattern},korean_reading.ilike.${pattern},meaning.ilike.${pattern},romanization.ilike.${pattern}`)
          .limit(6),
        supabase
          .from("grammar_patterns")
          .select("id, pattern, meaning, level")
          .or(`pattern.ilike.${pattern},meaning.ilike.${pattern},structure.ilike.${pattern}`)
          .limit(6),
        supabase
          .from("vocabulary")
          .select("id, korean, meaning, level")
          .or(`korean.ilike.${pattern},meaning.ilike.${pattern},romanization.ilike.${pattern},topic.ilike.${pattern}`)
          .limit(6),
        supabase
          .from("lessons")
          .select("id, title, sort_order, passage_id, course_id, grammar_focus")
          .or(`title.ilike.${pattern},grammar_focus.ilike.${pattern}`)
          .limit(6),
      ]);
      const out: Result[] = [];
      (candy.data ?? []).forEach((r) => out.push({ kind: "candy", id: r.id, title: r.title, level: r.level }));
      (hanja.data ?? []).forEach((r) => out.push({ kind: "hanja", id: r.id, character: r.character, reading: r.korean_reading, meaning: r.meaning }));
      (grammar.data ?? []).forEach((r) => out.push({ kind: "grammar", id: r.id, pattern: r.pattern, meaning: r.meaning, level: r.level }));
      (vocab.data ?? []).forEach((r) => out.push({ kind: "vocab", id: r.id, korean: r.korean, meaning: r.meaning, level: r.level }));
      (lessons.data ?? []).forEach((r) => out.push({ kind: "lesson", id: r.id, title: r.title, level: "lesson", passage_id: r.passage_id }));
      setResults(out);
      setLoading(false);
    }, 180);
    return () => clearTimeout(t);
  }, [q]);

  function go(r: Result) {
    setOpen(false);
    setQ("");
    if (r.kind === "candy") navigate({ to: "/read", search: { passage: r.id } as never });
    else if (r.kind === "hanja") navigate({ to: "/study", search: { tab: "hanja" } as never });
    else if (r.kind === "grammar") navigate({ to: "/study", search: { tab: "grammar" } as never });
    else if (r.kind === "vocab") navigate({ to: "/study", search: { tab: "vocab" } as never });
    else if (r.kind === "lesson") navigate({ to: "/read", search: { passage: r.passage_id ?? undefined } as never });
  }

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)} className="contents">{trigger}</span>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:border-primary hover:text-primary"
          aria-label="Search"
        >
          <Search className="h-3.5 w-3.5" /> Search
          <kbd className="ml-1 hidden rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-primary sm:inline">⌘K</kbd>
        </button>
      )}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search Candy, Hanja, grammar, vocab, lessons — Korean or English" value={q} onValueChange={setQ} />
        <CommandList>
          {loading && <div className="px-4 py-6 text-sm text-muted-foreground">Searching…</div>}
          {!loading && q && results.length === 0 && <CommandEmpty>No matches.</CommandEmpty>}
          {results.some((r) => r.kind === "candy") && (
            <CommandGroup heading="Candy readings">
              {results.filter((r) => r.kind === "candy").map((r) => (
                <CommandItem key={r.id} onSelect={() => go(r)}>
                  <Sparkles className="mr-2 h-4 w-4 text-primary" />
                  <span className="flex-1">{(r as Extract<Result,{kind:"candy"}>).title}</span>
                  <span className="text-[11px] text-muted-foreground">{(r as Extract<Result,{kind:"candy"}>).level}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {results.some((r) => r.kind === "hanja") && (
            <CommandGroup heading="Hanja">
              {results.filter((r) => r.kind === "hanja").map((r) => {
                const h = r as Extract<Result,{kind:"hanja"}>;
                return (
                  <CommandItem key={h.id} onSelect={() => go(h)}>
                    <span className="mr-2 font-korean text-lg text-primary">{h.character}</span>
                    <span className="flex-1">{h.meaning}</span>
                    <span className="text-[11px] font-korean text-muted-foreground">{h.reading}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
          {results.some((r) => r.kind === "grammar") && (
            <CommandGroup heading="Grammar patterns">
              {results.filter((r) => r.kind === "grammar").map((r) => {
                const g = r as Extract<Result,{kind:"grammar"}>;
                return (
                  <CommandItem key={g.id} onSelect={() => go(g)}>
                    <BookOpen className="mr-2 h-4 w-4 text-primary" />
                    <span className="font-korean">{g.pattern}</span>
                    <span className="ml-2 flex-1 text-muted-foreground">{g.meaning}</span>
                    <span className="text-[11px] text-muted-foreground">{g.level}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
          {results.some((r) => r.kind === "vocab") && (
            <CommandGroup heading="Vocabulary">
              {results.filter((r) => r.kind === "vocab").map((r) => {
                const v = r as Extract<Result,{kind:"vocab"}>;
                return (
                  <CommandItem key={v.id} onSelect={() => go(v)}>
                    <Bookmark className="mr-2 h-4 w-4 text-primary" />
                    <span className="font-korean">{v.korean}</span>
                    <span className="ml-2 flex-1 text-muted-foreground">{v.meaning}</span>
                    <span className="text-[11px] text-muted-foreground">{v.level}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
          {results.some((r) => r.kind === "lesson") && (
            <CommandGroup heading="Lessons">
              {results.filter((r) => r.kind === "lesson").map((r) => {
                const l = r as Extract<Result,{kind:"lesson"}>;
                return (
                  <CommandItem key={l.id} onSelect={() => go(l)}>
                    <BookOpen className="mr-2 h-4 w-4 text-primary" />
                    <span>{l.title}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
          <CommandGroup heading="Jump to">
            <CommandItem onSelect={() => { setOpen(false); navigate({ to: "/chat" }); }}>
              <MessagesSquare className="mr-2 h-4 w-4 text-primary" /> Open Soyeon chat
            </CommandItem>
            <CommandItem onSelect={() => { setOpen(false); navigate({ to: "/study", search: { tab: "hanja" } as never }); }}>
              <span className="mr-2 font-korean text-primary">漢</span> Study — Hanja, Grammar & Vocab
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
