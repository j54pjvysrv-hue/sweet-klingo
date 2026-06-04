import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Petals } from "@/components/petals";
import { LEVELS, type Level } from "@/lib/levels";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Pick your level — Sweet" },
      { name: "description", content: "Choose the Korean reading level that fits you today." },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const [picked, setPicked] = useState<Level | null>(null);
  const [busy, setBusy] = useState(false);

  // Prefill with existing profile level if any
  useEffect(() => {
    supabase
      .from("profiles")
      .select("level, onboarded")
      .single()
      .then(({ data }) => {
        if (data?.level) setPicked(data.level as Level);
      });
  }, []);

  async function confirm() {
    if (!picked) return;
    setBusy(true);
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes.user?.id;
    if (!uid) {
      setBusy(false);
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: uid, level: picked, onboarded: true }, { onConflict: "id" });
    if (error) {
      toast.error(error.message);
      setBusy(false);
      return;
    }
    toast.success(`Set to ${picked} · let’s read!`);
    navigate({ to: "/courses" });
  }

  return (
    <div className="relative">
      <Petals count={10} />
      <div className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Welcome to Sweet
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Where would you like to start?
          </h1>
          <p className="mt-3 text-muted-foreground">
            Pick any level — you can switch anytime. Sweet adapts translations, audio
            speed, and highlighting to match.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LEVELS.map((l) => {
            const active = picked === l.id;
            return (
              <button
                key={l.id}
                onClick={() => setPicked(l.id)}
                className={
                  "group flex flex-col rounded-3xl border p-5 text-left transition-all " +
                  (active
                    ? "border-primary bg-card shadow-soft ring-2 ring-[color:var(--blossom-soft)]"
                    : "border-border bg-card hover:-translate-y-1 hover:border-primary/50 hover:shadow-petal")
                }
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-blossom text-2xl text-primary-foreground shadow-petal">
                    {l.emoji}
                  </span>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
                    Level {l.id.slice(1)}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-foreground">{l.name}</h3>
                <p className="mt-1 text-sm italic text-muted-foreground">“{l.tagline}”</p>
                <p className="mt-3 text-sm text-foreground/80">{l.pitch}</p>
                <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                  {l.features.slice(0, 3).map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" /> {f}
                    </li>
                  ))}
                </ul>
                <span className="mt-4 text-xs font-medium text-primary">
                  Goal · {l.goal}
                </span>
                {active && (
                  <span className="mt-3 inline-flex items-center gap-1 self-start rounded-full bg-gradient-blossom px-3 py-1 text-xs font-semibold text-primary-foreground shadow-petal">
                    <Check className="h-3.5 w-3.5" /> Selected
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3">
          <button
            disabled={!picked || busy}
            onClick={confirm}
            className="rounded-full bg-gradient-blossom px-8 py-3 text-base font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.03] disabled:opacity-50"
          >
            {busy ? "Saving…" : "Start my first chapter"}
          </button>
          <button
            onClick={() => navigate({ to: "/quiz" })}
            className="rounded-full border border-border bg-card px-6 py-2 text-sm font-semibold text-foreground hover:border-primary hover:text-primary"
          >
            Not sure? Take the 60-second placement quiz →
          </button>
          <p className="text-xs text-muted-foreground">You can switch levels anytime from your profile.</p>
        </div>
      </div>
    </div>
  );
}
