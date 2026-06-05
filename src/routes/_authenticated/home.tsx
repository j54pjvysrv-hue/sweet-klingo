import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Award, BookOpen, Flame, MessagesSquare, Search, Sparkles, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Petals } from "@/components/petals";
import { GlobalSearch } from "@/components/global-search";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Home — Sweet" },
      { name: "description", content: "Your Sweet progress, streak, and gentle achievements." },
    ],
  }),
  component: HomeProgress,
});

type Profile = { display_name: string | null; level: string; streak_days: number; daily_goal_min: number; last_active_date: string | null };
type Day = { day: string; minutes: number; words_saved: number; lessons_done: number };
type Achievement = { id: string; code: string; title: string; description: string | null; emoji: string | null; earned_at: string };

const BADGES = [
  { code: "first_word", title: "First save", description: "Saved your first word", emoji: "🌱", earn: (s: Stats) => s.totalWords >= 1 },
  { code: "streak_3", title: "3-day streak", description: "Three days in a row", emoji: "🔥", earn: (s: Stats) => s.streak >= 3 },
  { code: "streak_7", title: "A blossoming week", description: "7-day streak", emoji: "🌸", earn: (s: Stats) => s.streak >= 7 },
  { code: "ten_words", title: "10 saved words", description: "Vocabulary growing", emoji: "📚", earn: (s: Stats) => s.totalWords >= 10 },
  { code: "first_lesson", title: "First lesson", description: "Completed a Candy", emoji: "☕", earn: (s: Stats) => s.totalLessons >= 1 },
  { code: "goal_hit", title: "Goal hit", description: "Met your daily reading goal", emoji: "🎯", earn: (s: Stats) => s.todayMinutes >= s.goalMin },
];

type Stats = { totalWords: number; totalLessons: number; streak: number; todayMinutes: number; goalMin: number };

function HomeProgress() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [days, setDays] = useState<Day[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [totalWords, setTotalWords] = useState(0);
  const [totalLessons, setTotalLessons] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: d }, { data: a }, { count: w }, { count: l }] = await Promise.all([
        supabase.from("profiles").select("display_name, level, streak_days, daily_goal_min, last_active_date").maybeSingle(),
        supabase.from("daily_progress").select("day, minutes, words_saved, lessons_done").order("day", { ascending: false }).limit(14),
        supabase.from("achievements").select("*").order("earned_at", { ascending: false }),
        supabase.from("vocab_saved").select("id", { count: "exact", head: true }),
        supabase.from("user_progress").select("id", { count: "exact", head: true }).not("completed_at", "is", null),
      ]);
      setProfile(p as Profile | null);
      setDays((d ?? []) as Day[]);
      setAchievements((a ?? []) as Achievement[]);
      setTotalWords(w ?? 0);
      setTotalLessons(l ?? 0);
      setLoading(false);

      // Streak + badge eval (lightweight)
      const today = new Date().toISOString().slice(0, 10);
      const todayRow = (d ?? []).find((r) => r.day === today);
      const goalMin = p?.daily_goal_min ?? 10;
      const stats: Stats = {
        totalWords: w ?? 0,
        totalLessons: l ?? 0,
        streak: p?.streak_days ?? 0,
        todayMinutes: todayRow?.minutes ?? 0,
        goalMin,
      };
      const earnedCodes = new Set((a ?? []).map((x) => x.code));
      const toEarn = BADGES.filter((b) => b.earn(stats) && !earnedCodes.has(b.code));
      if (toEarn.length) {
        const { data: u } = await supabase.auth.getUser();
        if (u.user) {
          await supabase.from("achievements").insert(
            toEarn.map((b) => ({ user_id: u.user!.id, code: b.code, title: b.title, description: b.description, emoji: b.emoji })),
          );
          const { data: a2 } = await supabase.from("achievements").select("*").order("earned_at", { ascending: false });
          setAchievements((a2 ?? []) as Achievement[]);
        }
      }
    })();
  }, []);

  if (loading) return <div className="mx-auto max-w-6xl px-5 py-14 text-sm text-muted-foreground">Loading your home…</div>;

  const today = new Date().toISOString().slice(0, 10);
  const todayRow = days.find((d) => d.day === today);
  const todayMin = todayRow?.minutes ?? 0;
  const goal = profile?.daily_goal_min ?? 10;
  const pct = Math.min(100, Math.round((todayMin / goal) * 100));

  return (
    <div className="relative">
      <Petals count={8} />
      <div className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="h-3.5 w-3.5" /> Welcome back
            </span>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Hi {profile?.display_name ?? "friend"} 🌸
            </h1>
            <p className="mt-2 text-muted-foreground">
              You're learning at <strong className="text-foreground">{profile?.level ?? "L1"}</strong>. Take a Sweet hour.
            </p>
          </div>
          <GlobalSearch
            trigger={
              <button className="hidden items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground hover:border-primary hover:text-primary sm:inline-flex">
                <Search className="h-4 w-4" /> Search… <kbd className="rounded bg-secondary px-1.5 py-0.5 text-[10px] font-semibold text-primary">⌘K</kbd>
              </button>
            }
          />
        </div>

        {/* Top stats */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card icon={Flame} label="Current streak" value={`${profile?.streak_days ?? 0} day${(profile?.streak_days ?? 0) === 1 ? "" : "s"}`} tone />
          <Card icon={Target} label="Today's goal" value={`${todayMin}/${goal} min`} extra={<Progress pct={pct} />} />
          <Card icon={BookOpen} label="Lessons done" value={String(totalLessons)} />
          <Card icon={Award} label="Saved words" value={String(totalWords)} />
        </div>

        {/* Continue */}
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          <Link to="/library" className="rounded-3xl border border-border bg-card p-6 shadow-petal transition-all hover:-translate-y-1 hover:border-primary">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="mt-3 font-display text-lg font-semibold">Browse Candy</h3>
            <p className="mt-1 text-sm text-muted-foreground">60+ stories across daily life, K-drama, career, TOPIK.</p>
          </Link>
          <Link to="/chat" className="rounded-3xl border border-border bg-card p-6 shadow-petal transition-all hover:-translate-y-1 hover:border-primary">
            <MessagesSquare className="h-5 w-5 text-primary" />
            <h3 className="mt-3 font-display text-lg font-semibold">Ask Soyeon</h3>
            <p className="mt-1 text-sm text-muted-foreground">Threaded conversations — your context is remembered.</p>
          </Link>
          <Link to="/hanja" className="rounded-3xl border border-border bg-card p-6 shadow-petal transition-all hover:-translate-y-1 hover:border-primary">
            <span className="font-korean text-2xl text-primary">漢</span>
            <h3 className="mt-3 font-display text-lg font-semibold">Hanja lookup</h3>
            <p className="mt-1 text-sm text-muted-foreground">Roots of Korean vocabulary, with readings and examples.</p>
          </Link>
        </div>

        {/* Last 14 days */}
        <section className="mt-12">
          <h2 className="font-display text-xl font-bold text-foreground">Past two weeks</h2>
          <div className="mt-4 flex items-end gap-1.5 rounded-3xl border border-border bg-card p-5 shadow-petal">
            {Array.from({ length: 14 }, (_, i) => {
              const d = new Date(); d.setDate(d.getDate() - (13 - i));
              const iso = d.toISOString().slice(0, 10);
              const row = days.find((x) => x.day === iso);
              const m = row?.minutes ?? 0;
              const h = Math.max(6, Math.min(100, (m / Math.max(goal, 5)) * 100));
              return (
                <div key={iso} className="flex flex-1 flex-col items-center gap-1">
                  <div title={`${iso}: ${m} min`} className="w-full rounded-md bg-gradient-blossom" style={{ height: `${h}px`, opacity: m ? 1 : 0.18 }} />
                  <span className="text-[10px] text-muted-foreground">{d.getDate()}</span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Achievements */}
        <section className="mt-12">
          <h2 className="font-display text-xl font-bold text-foreground">Achievements</h2>
          <p className="mt-1 text-sm text-muted-foreground">Small wins, gentle reminders — no streak shame.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {BADGES.map((b) => {
              const earned = achievements.some((a) => a.code === b.code);
              return (
                <div key={b.code} className={"rounded-2xl border bg-card p-4 transition-opacity " + (earned ? "border-primary shadow-petal" : "border-dashed border-border opacity-60")}>
                  <div className="text-3xl">{b.emoji}</div>
                  <div className="mt-2 font-semibold text-foreground">{b.title}</div>
                  <div className="text-xs text-muted-foreground">{b.description}</div>
                  {earned && <div className="mt-2 inline-flex rounded-full bg-gradient-blossom px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">Earned</div>}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function Card({ icon: Icon, label, value, extra, tone }: { icon: typeof Flame; label: string; value: string; extra?: React.ReactNode; tone?: boolean }) {
  return (
    <div className={"rounded-3xl border bg-card p-5 shadow-petal " + (tone ? "border-primary/50" : "border-border")}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" /> {label}
      </div>
      <div className="mt-2 font-display text-2xl font-bold text-foreground">{value}</div>
      {extra}
    </div>
  );
}

function Progress({ pct }: { pct: number }) {
  return (
    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
      <div className="h-full bg-gradient-blossom transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}
