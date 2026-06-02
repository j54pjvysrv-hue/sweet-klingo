import { useState } from "react";
import { Volume2, X, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

export type Token = {
  text: string;
  /** if defined, this token is a clickable Korean unit */
  info?: {
    romanization: string;
    meaning: string;
    pos?: string;
    grammar?: string;
    note?: string;
  };
};

export type Passage = {
  title: string;
  level: string;
  topic: string;
  englishHint?: string;
  lines: Token[][];
};

export function CandyReader({ passage }: { passage: Passage }) {
  const [active, setActive] = useState<{ line: number; idx: number } | null>(null);
  const activeToken =
    active != null ? passage.lines[active.line]?.[active.idx] : undefined;

  return (
    <div className="relative">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          {passage.level}
        </span>
        <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          {passage.topic}
        </span>
        <button
          type="button"
          className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <Volume2 className="h-3.5 w-3.5" /> Narrate
        </button>
      </div>

      <h2 className="font-korean text-2xl font-bold text-foreground sm:text-3xl">
        {passage.title}
      </h2>
      {passage.englishHint && (
        <p className="mt-1 text-sm italic text-muted-foreground">{passage.englishHint}</p>
      )}

      <div className="mt-6 space-y-4 font-korean text-lg leading-loose text-foreground sm:text-xl">
        {passage.lines.map((line, li) => (
          <p key={li} className="text-balance">
            {line.map((tok, ti) =>
              tok.info ? (
                <button
                  key={ti}
                  type="button"
                  onClick={() => setActive({ line: li, idx: ti })}
                  className={cn(
                    "mx-[1px] rounded-md px-0.5 transition-colors",
                    "underline decoration-[color:var(--blossom)] decoration-dotted decoration-2 underline-offset-4",
                    "hover:bg-[color:var(--blossom-soft)]/60 hover:text-primary",
                    active?.line === li && active?.idx === ti && "bg-[color:var(--blossom-soft)] text-primary",
                  )}
                >
                  {tok.text}
                </button>
              ) : (
                <span key={ti}>{tok.text}</span>
              ),
            )}
          </p>
        ))}
      </div>

      {activeToken?.info && (
        <div className="animate-fade-up sticky bottom-4 mt-8 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-korean text-2xl font-semibold text-primary">{activeToken.text}</div>
              <div className="text-sm text-muted-foreground">{activeToken.info.romanization}</div>
            </div>
            <div className="flex items-center gap-1">
              <button className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-primary" aria-label="Save">
                <Bookmark className="h-4 w-4" />
              </button>
              <button
                onClick={() => setActive(null)}
                className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="mt-3 space-y-2 text-sm">
            <div>
              <span className="font-semibold text-foreground">Meaning · </span>
              <span className="text-muted-foreground">{activeToken.info.meaning}</span>
            </div>
            {activeToken.info.pos && (
              <div>
                <span className="font-semibold text-foreground">Part of speech · </span>
                <span className="text-muted-foreground">{activeToken.info.pos}</span>
              </div>
            )}
            {activeToken.info.grammar && (
              <div>
                <span className="font-semibold text-foreground">Grammar · </span>
                <span className="text-muted-foreground">{activeToken.info.grammar}</span>
              </div>
            )}
            {activeToken.info.note && (
              <div className="rounded-lg bg-secondary/60 p-3 text-muted-foreground">
                <span className="font-semibold text-primary">Sana’s note · </span>
                {activeToken.info.note}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
