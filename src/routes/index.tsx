import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookOpen, Sparkles, Headphones, MessagesSquare, Wand2, Repeat } from "lucide-react";
import heroBlossoms from "@/assets/hero-blossoms.jpg";
import sanaAvatar from "@/assets/sana-avatar.png";
import { CandyReader } from "@/components/candy-reader";
import { Petals } from "@/components/petals";
import { cafePassage, candyLibrary } from "@/lib/sweet-content";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sweet — Learn Korean through stories, not flashcards" },
      { name: "description", content: "Read real Korean tailored to your level. Tap any word for instant grammar help. Chat with Sana, your AI Korean tutor." },
      { property: "og:title", content: "Sweet — Learn Korean through stories" },
      { property: "og:description", content: "AI-powered Korean immersion with tappable tooltips, personalized Candy lessons, and a tutor named Sana." },
      { property: "og:image", content: heroBlossoms },
    ],
  }),
  component: HomePage,
});

const pillars = [
  { icon: BookOpen, title: "Contextual reading", body: "Learn vocabulary and grammar where it actually lives — inside real Korean sentences." },
  { icon: Wand2, title: "Instant AI help", body: "Tap any word for definitions, grammar notes, politeness levels, and cultural nuance." },
  { icon: Sparkles, title: "Personalized Candy", body: "Generate bite-sized stories about cafés, K-dramas, your job, or anything you love." },
  { icon: Repeat, title: "Regenerative Review™", body: "Saved words quietly return inside new stories — review through meaning, not drilling." },
  { icon: Headphones, title: "Synchronized narration", body: "Native-quality audio reads with you, highlighting each word as it’s spoken." },
  { icon: MessagesSquare, title: "Sana, your tutor", body: "A patient AI coach for grammar deep dives, roleplay, and TOPIK prep." },
];

function HomePage() {
  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <img
          src={heroBlossoms}
          alt=""
          aria-hidden
          width={1600}
          height={1200}
          className="absolute inset-0 h-full w-full object-cover opacity-50 mix-blend-multiply"
        />
        <Petals count={18} />
        <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-16 sm:pt-24 md:pb-28">
          <div className="animate-fade-up mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary backdrop-blur">
              <span className="font-korean text-sm">🌸 한국어</span> · AI-native Korean
            </span>
            <h1 className="mt-6 text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl">
              Learn Korean the way it’s <span className="bg-gradient-blossom bg-clip-text text-transparent">actually used</span>.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
              Sweet turns real Korean — stories, K-drama lines, workplace chats — into
              short, tappable lessons. Less drilling. More understanding.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-blossom px-6 py-3 text-base font-semibold text-primary-foreground shadow-soft transition-transform hover:scale-[1.03]"
              >
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/read"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-base font-semibold text-foreground hover:border-primary hover:text-primary"
              >
                Try a Candy demo
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">No streak shame · Ad-free · Built for immersion</p>
          </div>
        </div>
      </section>

      {/* LIVE CANDY DEMO */}
      <section className="relative -mt-10 px-5">
        <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-10">
          <div className="mb-4 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-primary">
            <span>Live demo</span>
            <span className="text-muted-foreground">Tap any underlined word</span>
          </div>
          <CandyReader passage={cafePassage} />
        </div>
      </section>

      {/* PILLARS */}
      <section className="mx-auto mt-24 max-w-6xl px-5">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Six pillars. One soft, sweet way to learn.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Every feature in Sweet is designed around one idea: meaningful Korean,
            with help exactly when you need it.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {pillars.map((p, i) => (
            <div
              key={p.title}
              className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-petal"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-blossom text-primary-foreground shadow-petal">
                <p.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-foreground">{p.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SANA */}
      <section className="mx-auto mt-24 max-w-6xl px-5">
        <div className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-[color:var(--blossom-soft)]/40 to-card p-6 shadow-soft sm:p-12">
          <div className="grid items-center gap-10 md:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                Meet Sana
              </span>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Your AI Korean tutor, on call.
              </h2>
              <p className="mt-3 max-w-md text-muted-foreground">
                Sana explains grammar like a friend who actually loves linguistics. Ask
                why <span className="font-korean text-foreground">은/는</span> vs{" "}
                <span className="font-korean text-foreground">이/가</span>, request a
                roleplay, or prep for TOPIK II.
              </p>
              <Link
                to="/chat"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-blossom px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-petal hover:scale-[1.02]"
              >
                Start a conversation <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="relative mx-auto w-full max-w-sm">
              <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
                <div className="flex items-center gap-3">
                  <img src={sanaAvatar} alt="Sana" width={48} height={48} className="h-12 w-12 rounded-full bg-[color:var(--blossom-soft)]/40" loading="lazy" />
                  <div>
                    <div className="font-display font-semibold text-foreground">Sana</div>
                    <div className="text-xs text-muted-foreground">AI Korean tutor</div>
                  </div>
                </div>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="ml-auto w-fit max-w-[80%] rounded-2xl rounded-br-sm bg-gradient-blossom px-4 py-2 text-primary-foreground">
                    Why do people say <span className="font-korean">밥 먹었어?</span> instead of “hi”?
                  </div>
                  <div className="w-fit max-w-[85%] rounded-2xl rounded-bl-sm bg-secondary px-4 py-2 text-foreground">
                    It’s a warm, food-loving way of asking <span className="font-korean">잘 지내?</span> — literally
                    “Did you eat?” It signals care, not curiosity about lunch 🍚
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CANDY PREVIEW */}
      <section className="mx-auto mt-24 max-w-6xl px-5">
        <div className="flex items-end justify-between gap-4">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              A library of Candy, always fresh.
            </h2>
            <p className="mt-3 text-muted-foreground">
              Pick from thousands of templates, or describe what you want and Sweet
              generates a story for you.
            </p>
          </div>
          <Link to="/library" className="hidden text-sm font-semibold text-primary hover:underline sm:block">
            Browse all →
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {candyLibrary.slice(0, 6).map((c) => (
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
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="mx-auto mt-24 max-w-4xl px-5">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-blossom p-10 text-center shadow-soft sm:p-14">
          <Petals count={10} />
          <div className="relative">
            <h2 className="font-display text-3xl font-bold text-primary-foreground sm:text-5xl">
              Start your Sweet hour.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-primary-foreground/85">
              Read your first Candy in under a minute. No card required.
            </p>
            <Link
              to="/read"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-background px-6 py-3 text-base font-semibold text-primary shadow-soft hover:scale-[1.03]"
            >
              Read your first Candy <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
