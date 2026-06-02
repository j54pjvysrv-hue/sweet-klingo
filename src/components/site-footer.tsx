import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-background/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div className="font-display text-base font-semibold text-foreground">Sweet 🌸</div>
        <p>Learn Korean through stories, not flashcards.</p>
        <div className="flex gap-4">
          <Link to="/library" className="hover:text-primary">Library</Link>
          <Link to="/read" className="hover:text-primary">Candy</Link>
          <Link to="/chat" className="hover:text-primary">Sana</Link>
        </div>
      </div>
    </footer>
  );
}
