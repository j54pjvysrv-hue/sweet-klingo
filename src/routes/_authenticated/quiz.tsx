import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Petals } from "@/components/petals";
import { supabase } from "@/integrations/supabase/client";
import type { Level } from "@/lib/levels";

export const Route = createFileRoute("/_authenticated/quiz")({
  head: () => ({ meta: [{ title: "Placement quiz — Sweet" }] }),
  component: QuizPage,
});

type Q = { id: string; korean: string; english: string; options: string[]; correct: number; level: Level };

const QUESTIONS: Q[] = [
  { id: "q1", korean: "안녕하세요", english: "What does this greeting mean?", options: ["Goodbye", "Hello (polite)", "Thank you", "Sorry"], correct: 1, level: "L1" },
  { id: "q2", korean: "저는 학생이에요.", english: "Pick the closest translation.", options: ["I am a teacher.", "I am a student.", "I have a student.", "Are you a student?"], correct: 1, level: "L1" },
  { id: "q3", korean: "밥을 먹었어요.", english: "What tense is this?", options: ["Present", "Past polite", "Future", "Imperative"], correct: 1, level: "L1" },
  { id: "q4", korean: "저는 친구하고 갔어요.", english: "What does 하고 mean here?", options: ["to", "with / and", "from", "for"], correct: 1, level: "L2" },
  { id: "q5", korean: "비가 와서 집에 있었어요.", english: "Why did they stay home?", options: ["Because of rain", "Because of work", "Because of friends", "For fun"], correct: 0, level: "L2" },
  { id: "q6", korean: "한국어를 공부하고 있어요.", english: "What does -고 있다 express?", options: ["Past", "Progressive", "Future possibility", "Command"], correct: 1, level: "L2" },
  { id: "q7", korean: "이 책을 다 읽었던 사람", english: "What does -았/었던 mean?", options: ["Future plan", "Past retrospective modifier", "Imperative", "Honorific"], correct: 1, level: "L3" },
  { id: "q8", korean: "공부를 하려고 도서관에 갔어요.", english: "What does -려고 mean?", options: ["because", "in order to", "even though", "while"], correct: 1, level: "L3" },
  { id: "q9", korean: "정책은 시행되기까지 시간이 걸린다.", english: "Pick the closest meaning.", options: ["The policy is good.", "Implementation takes time.", "Time was wasted.", "It's already done."], correct: 1, level: "L4" },
  { id: "q10", korean: "그는 묵묵히 자신의 길을 걸어갔다.", english: "What's the literary tone?", options: ["Cheerful", "Quietly resolute", "Angry", "Confused"], correct: 1, level: "L5" },
];

function scoreToLevel(score: number): Level {
  if (score >= 9) return "L5";
  if (score >= 7) return "L4";
  if (score >= 5) return "L3";
  if (score >= 3) return "L2";
  return "L1";
}

function QuizPage() {
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [done, setDone] = useState(false);
  const [suggested, setSuggested] = useState<Level | null>(null);
  const [busy, setBusy] = useState(false);

  const q = QUESTIONS[idx];

  function pick(n: number) {
    setAnswers((a) => ({ ...a, [q.id]: n }));
  }

  function next() {
    if (idx < QUESTIONS.length - 1) setIdx(idx + 1);
    else finish();
  }

  async function finish() {
    setBusy(true);
    const score = QUESTIONS.reduce((s, qq) => (answers[qq.id] === qq.correct ? s + 1 : s), 0);
    const level = scoreToLevel(score);
    setSuggested(level);
    const { data: sess } = await supabase.auth.getSession();
    const token = sess.session?.access_token;
    if (token) {
      try {
        await fetch("/api/quiz-submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ score, total: QUESTIONS.length, suggested_level: level, answers }),
        });
      } catch (e) {
        console.error("quiz submit failed", e);
      }
    }
    setDone(true);
    setBusy(false);
  }

  async function accept() {
    if (!suggested) return;
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("profiles").upsert(
      { id: u.user.id, level: suggested, onboarded: true },
      { onConflict: "id" },
    );
    if (error) { toast.error(error.message); setBusy(false); return; }
    toast.success(`Personal course set to ${suggested}`);
    navigate({ to: "/courses" });
  }

  if (done) {
    return (
      <div className="relative">
        <Petals count={8} />
        <div className="mx-auto max-w-2xl px-5 py-16 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-primary" />
          <h1 className="mt-4 font-display text-3xl font-bold sm:text-4xl">Your level: {suggested}</h1>
          <p className="mt-3 text-muted-foreground">
            Based on your answers, Sweet will personalize your courses, Candy passages, and Soyeon hints to <strong>{suggested}</strong>.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button onClick={accept} disabled={busy} className="rounded-full bg-gradient-blossom px-6 py-3 text-base font-semibold text-primary-foreground shadow-petal hover:scale-[1.02] disabled:opacity-50">
              {busy ? "Saving…" : "Build my personal course"}
            </button>
            <button onClick={() => navigate({ to: "/onboarding" })} className="rounded-full border border-border bg-card px-6 py-3 text-base font-semibold text-foreground hover:border-primary">
              Pick a different level
            </button>
          </div>
        </div>
      </div>
    );
  }

  const picked = answers[q.id] ?? -1;

  return (
    <div className="relative">
      <Petals count={6} />
      <div className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            Placement quiz · {idx + 1} / {QUESTIONS.length}
          </span>
          <h1 className="mt-4 font-display text-2xl font-bold sm:text-3xl">How well do you read this?</h1>
        </div>

        <div className="mt-8 rounded-3xl border border-border bg-card p-6 shadow-petal sm:p-10">
          <p className="text-center font-korean text-3xl text-foreground sm:text-4xl">{q.korean}</p>
          <p className="mt-2 text-center text-sm italic text-muted-foreground">{q.english}</p>
          <div className="mt-6 grid gap-2">
            {q.options.map((opt, i) => (
              <button
                key={i}
                onClick={() => pick(i)}
                className={"flex items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm transition-all " + (picked === i ? "border-primary bg-secondary text-foreground" : "border-border bg-background hover:border-primary/40")}
              >
                <span>{opt}</span>
                {picked === i && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setIdx(Math.max(0, idx - 1))}
            disabled={idx === 0}
            className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:border-primary disabled:opacity-40"
          >
            Back
          </button>
          <button
            onClick={next}
            disabled={picked < 0 || busy}
            className="rounded-full bg-gradient-blossom px-6 py-2 text-sm font-semibold text-primary-foreground shadow-petal hover:scale-[1.02] disabled:opacity-50"
          >
            {idx === QUESTIONS.length - 1 ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
