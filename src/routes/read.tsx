import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ChevronLeft } from "lucide-react";
import { CandyReader } from "@/components/candy-reader";
import { cafePassage } from "@/lib/sweet-content";

export const Route = createFileRoute("/read")({
  head: () => ({
    meta: [
      { title: "Candy Reader — Sweet" },
      { name: "description", content: "Read real Korean with instant tooltips for grammar, particles, conjugations, and nuance." },
      { property: "og:title", content: "Candy Reader — Sweet" },
      { property: "og:description", content: "Tap any Korean word for an instant AI breakdown." },
    ],
  }),
  component: ReadPage,
});

function ReadPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:py-14">
      <Link to="/library" className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-primary">
        <ChevronLeft className="h-4 w-4" /> Back to library
      </Link>
      <div className="mt-6 rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-10">
        <CandyReader passage={cafePassage} />
      </div>
      <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/60 p-5 text-sm text-muted-foreground">
        <p>
          <span className="font-semibold text-primary">Regenerative Review™ tip:</span> the
          words you tap are quietly woven back into future Candy lessons — so review
          happens through stories, not flashcards.
        </p>
      </div>
      <div className="mt-6 flex justify-end">
        <Link
          to="/chat"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-blossom px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-petal hover:scale-[1.02]"
        >
          Ask Sana about this passage <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
