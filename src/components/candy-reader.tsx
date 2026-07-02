import { useEffect, useState } from "react";
import { Volume2, Bookmark, ChevronLeft, ChevronRight, Settings2, Eye, EyeOff, MessageCircleHeart, Languages, CheckCircle2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Markdown } from "@/components/markdown";
import { recordLessonCompletion } from "@/lib/lesson-events";

export type Token = {
  text: string;
  info?: {
    romanization: string;
    meaning: string;
    pos?: string;
    grammar?: string;
    note?: string;
    pattern?: string;
    pattern_examples?: Array<{ ko: string; en: string }>;
  };
};

export type Passage = {
  id?: string;
  title: string;
  level: string;
  topic: string;
  englishHint?: string;
  lines: Token[][];
  lessonId?: string;
};

type TranslationMode = "off" | "tap" | "always";

type HanjaMatch = { character: string; korean_reading: string; meaning: string };
type GrammarMatch = { pattern: string; meaning: string; structure: string | null; examples: Array<{ ko: string; en: string }> };

export function CandyReader({ passage }: { passage: Passage }) {
  const sentences = passage.lines;
  const [focused, setFocused] = useState<number | null>(null);
  const [activeToken, setActiveToken] = useState<{ line: number; idx: number } | null>(null);
  const [textSize, setTextSize] = useState<"sm" | "md" | "lg">("md");
  const [lineSpacing, setLineSpacing] = useState<"snug" | "relaxed" | "loose">("relaxed");
  const [trMode, setTrMode] = useState<TranslationMode>("tap");
  const [trShownIdx, setTrShownIdx] = useState<Set<number>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [hanja, setHanja] = useState<HanjaMatch[]>([]);
  const [grammar, setGrammar] = useState<GrammarMatch | null>(null);
  const [completed, setCompleted] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [translations, setTranslations] = useState<Record<number, string>>({});
  const [translating, setTranslating] = useState<Set<number>>(new Set());

  async function fetchTranslation(li: number) {
    if (translations[li] || translating.has(li)) return;
    const ko = sentences[li].map((t) => t.text).join("").trim();
    if (!ko) return;
    setTranslating((s) => new Set(s).add(li));
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Not signed in");
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sentence: ko }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { translation?: string };
      if (data.translation) {
        setTranslations((m) => ({ ...m, [li]: data.translation! }));
      }
    } catch (err) {
      console.error("translate failed", err);
      toast.error("Translation failed — try again.");
    } finally {
      setTranslating((s) => { const n = new Set(s); n.delete(li); return n; });
    }
  }


  const token = activeToken != null ? sentences[activeToken.line]?.[activeToken.idx] : undefined;

  // Hanja lookup
  useEffect(() => {
    if (!token?.text) { setHanja([]); return; }
    const syllables = Array.from(token.text.trim()).filter((c) => /[\uAC00-\uD7AF]/.test(c));
    if (syllables.length === 0) { setHanja([]); return; }
    supabase
      .from("hanja")
      .select("character, korean_reading, meaning")
      .in("korean_reading", syllables)
      .limit(8)
      .then(({ data }) => setHanja((data ?? []) as HanjaMatch[]));
  }, [token]);

  // Grammar pattern lookup (from token.info.pattern OR fuzzy from token.info.grammar)
  useEffect(() => {
    setGrammar(null);
    const p = token?.info?.pattern?.trim();
    if (p) {
      supabase
        .from("grammar_patterns")
        .select("pattern, meaning, structure, examples")
        .eq("pattern", p)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setGrammar(data as GrammarMatch);
        });
    }
  }, [token]);

  // Keyboard nav
  useEffect(() => {
    if (focused == null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") setFocused((i) => Math.min(sentences.length - 1, (i ?? 0) + 1));
      else if (e.key === "ArrowLeft") setFocused((i) => Math.max(0, (i ?? 0) - 1));
      else if (e.key === "Escape") setFocused(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focused, sentences.length]);

  function narrate(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "ko-KR";
    u.rate = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  const sizeClass = textSize === "sm" ? "text-lg sm:text-xl" : textSize === "lg" ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl";
  const lhClass = lineSpacing === "snug" ? "leading-snug" : lineSpacing === "loose" ? "leading-loose" : "leading-relaxed";

  async function savePassageVocab() {
    if (!token?.info) return;
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) { toast.info("Sign in to save vocabulary."); return; }
    const { error } = await supabase.from("vocab_saved").upsert(
      {
        user_id: userRes.user.id,
        korean: token.text.trim(),
        romanization: token.info.romanization,
        meaning: token.info.meaning,
        pos: token.info.pos ?? null,
        grammar: token.info.grammar ?? null,
        note: token.info.note ?? null,
        source_passage_id: passage.id ?? null,
      },
      { onConflict: "user_id,korean" },
    );
    if (error) toast.error(error.message);
    else toast.success(`Saved ${token.text.trim()}`);
  }

  async function markComplete() {
    if (completing || completed) return;
    setCompleting(true);
    const minutes = Math.max(2, Math.round(sentences.length * 0.6));
    const res = await recordLessonCompletion({
      lessonId: passage.lessonId ?? null,
      passageId: passage.id ?? null,
      minutes,
    });
    setCompleting(false);
    if (res.ok) {
      setCompleted(true);
      toast.success("Lesson complete! Streak + goal updated 🌸");
    } else if (res.reason === "auth") {
      toast.info("Sign in to save progress.");
    }
  }

  function renderLine(li: number, line: Token[], inFocus = false) {
    const showTr = trMode === "always" || (trMode === "tap" && trShownIdx.has(li));
    const koreanOnly = line.map((t) => t.text).join("");
    const translation = translations[li];
    const isTranslating = translating.has(li);

    // Auto-fetch translation when needed
    if ((showTr || inFocus) && trMode !== "off" && !translation && !isTranslating) {
      // Defer so we don't setState during render
      queueMicrotask(() => fetchTranslation(li));
    }

    return (
      <div className="space-y-2">
        <p className={cn("text-balance font-korean text-foreground", sizeClass, lhClass)}>
          {line.map((tok, ti) =>
            tok.info ? (
              <button
                key={ti}
                type="button"
                onClick={() => setActiveToken({ line: li, idx: ti })}
                className={cn(
                  "mx-[1px] rounded-md px-0.5 transition-colors",
                  "underline decoration-[color:var(--blossom)] decoration-dotted decoration-2 underline-offset-4",
                  "hover:bg-[color:var(--blossom-soft)]/60 hover:text-primary",
                  activeToken?.line === li && activeToken?.idx === ti && "bg-[color:var(--blossom-soft)] text-primary",
                )}
              >
                {tok.text}
              </button>
            ) : (
              <span key={ti}>{tok.text}</span>
            ),
          )}
        </p>
        {(showTr || inFocus) && trMode !== "off" && (
          <p className="text-sm italic text-muted-foreground">
            {translation ?? (isTranslating ? "Translating…" : sentenceGloss(line))}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <button onClick={() => narrate(koreanOnly)} className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 hover:border-primary hover:text-primary">
            <Volume2 className="h-3 w-3" /> Listen
          </button>
          {trMode === "tap" && (
            <button
              onClick={() => {
                setTrShownIdx((s) => { const n = new Set(s); if (n.has(li)) n.delete(li); else n.add(li); return n; });
                fetchTranslation(li);
              }}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 hover:border-primary hover:text-primary"
            >
              {trShownIdx.has(li) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {trShownIdx.has(li) ? "Hide translation" : "Show translation"}
            </button>
          )}
          <Link
            to="/chat"
            search={{ passage: passage.id, sentence: koreanOnly } as never}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 hover:border-primary hover:text-primary"
          >
            <MessageCircleHeart className="h-3 w-3" /> Ask Soyeon
          </Link>
        </div>
      </div>
    );
  }


  return (
    <div className="relative">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">{passage.level}</span>
        <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">{passage.topic}</span>
        <div className="ml-auto flex items-center gap-1.5">
          <button type="button" onClick={() => setShowSettings((v) => !v)} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-primary">
            <Settings2 className="h-3.5 w-3.5" /> Reading
          </button>
          <button type="button" onClick={() => setFocused(focused == null ? 0 : null)} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-blossom px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-petal">
            {focused == null ? "Focus mode" : "Exit focus"}
          </button>
        </div>
      </div>

      {showSettings && <SettingsBar {...{ textSize, setTextSize, lineSpacing, setLineSpacing, trMode, setTrMode }} />}

      <h2 className="font-korean text-2xl font-bold text-foreground sm:text-3xl">{passage.title}</h2>
      {passage.englishHint && <p className="mt-1 text-sm italic text-muted-foreground">{passage.englishHint}</p>}

      {focused == null ? (
        <div className="mt-6 space-y-7">
          {sentences.map((line, li) => <div key={li}>{renderLine(li, line)}</div>)}
        </div>
      ) : (
        <FocusView sentences={sentences} focused={focused}
          onPrev={() => setFocused((i) => Math.max(0, (i ?? 0) - 1))}
          onNext={() => setFocused((i) => Math.min(sentences.length - 1, (i ?? 0) + 1))}
          renderLine={renderLine} />
      )}

      {/* Mark complete */}
      <div className="mt-8 flex justify-center">
        <button
          onClick={markComplete}
          disabled={completing || completed}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-petal transition-all",
            completed
              ? "bg-secondary text-primary"
              : "bg-gradient-blossom text-primary-foreground hover:scale-[1.02] disabled:opacity-60",
          )}
        >
          <CheckCircle2 className="h-4 w-4" />
          {completed ? "Marked complete · streak updated" : completing ? "Saving…" : "Mark lesson complete"}
        </button>
      </div>

      {/* Tap-to-learn dialog */}
      <Dialog open={!!token?.info} onOpenChange={(o) => !o && setActiveToken(null)}>
        <DialogContent className="max-w-md rounded-3xl">
          {token?.info && (
            <>
              <DialogHeader>
                <DialogTitle className="font-korean text-3xl text-primary">{token.text.trim()}</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">{token.info.romanization}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="font-semibold text-foreground">Meaning · </span>
                  <span className="text-foreground/80">{token.info.meaning}</span>
                </div>
                {token.info.pos && (
                  <div>
                    <span className="font-semibold text-foreground">Part of speech · </span>
                    <span className="text-muted-foreground">{token.info.pos}</span>
                  </div>
                )}
                {token.info.grammar && (
                  <div className="rounded-lg bg-secondary/40 p-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-primary">Grammar</div>
                    <Markdown className="prose-p:my-1 text-sm">{token.info.grammar}</Markdown>
                  </div>
                )}

                {/* Mini-pattern breakdown */}
                {(grammar || token.info.pattern) && (
                  <div className="rounded-lg border border-primary/40 bg-[color:var(--blossom-soft)]/30 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-primary">Mini-pattern</span>
                      <span className="font-korean text-sm font-semibold text-foreground">{grammar?.pattern ?? token.info.pattern}</span>
                    </div>
                    {(grammar?.meaning || token.info.pattern) && (
                      <p className="mt-1 text-sm text-foreground/80">{grammar?.meaning ?? "Reusable Korean structure"}</p>
                    )}
                    {grammar?.structure && (
                      <p className="mt-1 font-korean text-xs text-muted-foreground">{grammar.structure}</p>
                    )}
                    <div className="mt-2 space-y-1">
                      {(grammar?.examples ?? token.info.pattern_examples ?? []).slice(0, 3).map((ex, i) => (
                        <div key={i} className="rounded-md bg-card/60 px-2 py-1">
                          <div className="font-korean text-sm text-foreground">{ex.ko}</div>
                          <div className="text-xs italic text-muted-foreground">{ex.en}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {token.info.note && (
                  <div className="rounded-lg bg-secondary/60 p-3 text-muted-foreground">
                    <span className="font-semibold text-primary">Soyeon's note · </span>
                    {token.info.note}
                  </div>
                )}
                {hanja.length > 0 && (
                  <div className="rounded-lg border border-border bg-card p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wider text-primary">Hanja roots</span>
                      <Link to="/hanja" className="text-[11px] font-medium text-primary hover:underline">Open lookup →</Link>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {hanja.map((h) => (
                        <div key={h.character + h.korean_reading} className="flex items-center gap-2 rounded-full bg-secondary px-2.5 py-1">
                          <span className="font-korean text-lg text-primary">{h.character}</span>
                          <span className="font-korean text-xs text-foreground">{h.korean_reading}</span>
                          <span className="text-[11px] text-muted-foreground">{h.meaning}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button onClick={() => narrate(token.text.trim())} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-primary hover:text-primary">
                  <Volume2 className="h-3.5 w-3.5" /> Listen
                </button>
                <button onClick={savePassageVocab} className="inline-flex items-center gap-1.5 rounded-full bg-gradient-blossom px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-petal">
                  <Bookmark className="h-3.5 w-3.5" /> Save word
                </button>
                <Link
                  to="/chat"
                  search={{ passage: passage.id, word: token.text.trim() } as never}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium hover:border-primary hover:text-primary"
                  onClick={() => setActiveToken(null)}
                >
                  <MessageCircleHeart className="h-3.5 w-3.5" /> Ask Soyeon
                </Link>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FocusView({ sentences, focused, onPrev, onNext, renderLine }: {
  sentences: Token[][]; focused: number; onPrev: () => void; onNext: () => void;
  renderLine: (li: number, line: Token[], inFocus?: boolean) => React.ReactNode;
}) {
  const progress = ((focused + 1) / sentences.length) * 100;
  return (
    <div className="mt-6">
      <div className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full bg-gradient-blossom transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
      <div key={focused} className="animate-fade-up min-h-[40vh] rounded-3xl border border-border bg-card p-6 shadow-petal sm:p-10">
        {renderLine(focused, sentences[focused], true)}
      </div>
      <div className="mt-4 flex items-center justify-between text-sm">
        <button onClick={onPrev} disabled={focused === 0} className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-4 py-2 font-medium text-foreground hover:border-primary hover:text-primary disabled:opacity-40">
          <ChevronLeft className="h-4 w-4" /> Previous
        </button>
        <span className="text-xs text-muted-foreground">Sentence {focused + 1} of {sentences.length}</span>
        <button onClick={onNext} disabled={focused === sentences.length - 1} className="inline-flex items-center gap-1 rounded-full bg-gradient-blossom px-4 py-2 font-semibold text-primary-foreground shadow-petal hover:scale-[1.02] disabled:opacity-40">
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function SettingsBar({ textSize, setTextSize, lineSpacing, setLineSpacing, trMode, setTrMode }: {
  textSize: "sm" | "md" | "lg"; setTextSize: (v: "sm" | "md" | "lg") => void;
  lineSpacing: "snug" | "relaxed" | "loose"; setLineSpacing: (v: "snug" | "relaxed" | "loose") => void;
  trMode: TranslationMode; setTrMode: (v: TranslationMode) => void;
}) {
  return (
    <div className="mb-5 rounded-2xl border border-border bg-card p-4 shadow-petal">
      <div className="grid gap-3 sm:grid-cols-3">
        <Group label="Text size">
          {(["sm", "md", "lg"] as const).map((v) => (
            <Pill key={v} active={textSize === v} onClick={() => setTextSize(v)}>{v === "sm" ? "S" : v === "md" ? "M" : "L"}</Pill>
          ))}
        </Group>
        <Group label="Line spacing">
          {(["snug", "relaxed", "loose"] as const).map((v) => (
            <Pill key={v} active={lineSpacing === v} onClick={() => setLineSpacing(v)}>{v[0].toUpperCase() + v.slice(1)}</Pill>
          ))}
        </Group>
        <Group label={<span className="inline-flex items-center gap-1"><Languages className="h-3 w-3" /> Translation</span>}>
          {(["off", "tap", "always"] as const).map((v) => (
            <Pill key={v} active={trMode === v} onClick={() => setTrMode(v)}>{v === "off" ? "Korean only" : v === "tap" ? "Tap to reveal" : "Always on"}</Pill>
          ))}
        </Group>
      </div>
    </div>
  );
}

function Group({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={cn(
      "rounded-full px-3 py-1 text-xs font-medium transition-colors",
      active ? "bg-gradient-blossom text-primary-foreground shadow-petal" : "border border-border bg-background text-muted-foreground hover:text-primary",
    )}>{children}</button>
  );
}

function sentenceGloss(line: Token[]) {
  const parts: string[] = [];
  for (const t of line) if (t.info?.meaning) parts.push(t.info.meaning);
  return parts.length ? parts.join(" · ") : "Translation unavailable — tap a word for help.";
}
