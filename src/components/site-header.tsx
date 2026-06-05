import { Link, useNavigate } from "@tanstack/react-router";
import { Sparkles, LogOut } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { GlobalSearch } from "@/components/global-search";

const nav = [
  { to: "/", label: "Home" },
  { to: "/library", label: "Library" },
  { to: "/read", label: "Candy" },
  { to: "/hanja", label: "Hanja" },
  { to: "/chat", label: "Soyeon" },
  { to: "/courses", label: "Courses" },
  { to: "/home", label: "Progress" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5">
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold tracking-tight text-foreground">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-blossom text-primary-foreground shadow-petal">
            <Sparkles className="h-4 w-4" />
          </span>
          Sweet
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              activeOptions={{ exact: n.to === "/" }}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeProps={{ className: "rounded-full px-4 py-2 text-sm font-semibold bg-secondary text-primary" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <GlobalSearch />
          {!loading && user ? (
            <>
              <Link
                to="/courses"
                className="hidden rounded-full bg-gradient-blossom px-5 py-2 text-sm font-semibold text-primary-foreground shadow-petal hover:scale-[1.02] md:inline-flex"
              >
                Continue
              </Link>
              <button
                onClick={signOut}
                aria-label="Sign out"
                className="hidden h-10 w-10 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:text-primary md:grid"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className="hidden rounded-full bg-gradient-blossom px-5 py-2 text-sm font-semibold text-primary-foreground shadow-petal hover:scale-[1.02] md:inline-flex"
            >
              Sign in · free
            </Link>
          )}
          <button
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card md:hidden"
          >
            <div className="space-y-1.5">
              <span className="block h-0.5 w-4 bg-foreground" />
              <span className="block h-0.5 w-4 bg-foreground" />
            </div>
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-border/60 bg-background/95 md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col px-5 py-3">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-base font-medium text-foreground hover:bg-secondary"
              >
                {n.label}
              </Link>
            ))}
            {!loading && user ? (
              <button
                onClick={() => {
                  setOpen(false);
                  signOut();
                }}
                className="mt-1 rounded-lg px-3 py-3 text-left text-base font-medium text-foreground hover:bg-secondary"
              >
                Sign out
              </button>
            ) : (
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="mt-1 rounded-lg bg-gradient-blossom px-3 py-3 text-center text-base font-semibold text-primary-foreground"
              >
                Sign in · free
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
