import { ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Games",
  description: "College football games available on collegeknower."
};

export default function GamesPage() {
  return (
    <main className="page">
      <p className="eyebrow">collegeknower games</p>
      <h1 className="display-title">College football leads off.</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <Link
          href="/games/college-football/fbs-teams"
          className="group rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 no-underline"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black uppercase">Name Every FBS Team</h2>
              <p className="mt-2 text-[var(--color-muted)]">
                138 teams, 11 conference groups, 2026 alignment.
              </p>
            </div>
            <ArrowRight className="mt-1 text-[var(--color-accent)] transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </div>
        </Link>
      </div>
    </main>
  );
}
