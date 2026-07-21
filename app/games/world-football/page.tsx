import { ArrowRight, Trophy } from "lucide-react";
import Link from "next/link";
import { knowledgeThemes, quizThemeStyle } from "@/data/knowledge/themes";

export const metadata = {
  title: "World Football Knowers",
  description: "Choose a world football quiz on ball knowers."
};

export default function WorldFootballKnowersPage() {
  return (
    <main className="knowledge-shell" style={quizThemeStyle(knowledgeThemes.world)}>
      <section className="page">
        <p className="eyebrow">World football knowers</p>
        <h1 className="display-title">World football knowers.</h1>
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <Link
            href="/games/world-football/all-clubs"
            className="group rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 no-underline transition-colors hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-2)]"
          >
            <span className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] px-2 py-1 text-xs font-black uppercase text-[var(--color-muted)]">
              <Trophy size={14} aria-hidden="true" />
              Live
            </span>
            <div className="mt-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black uppercase">World clubs quiz</h2>
                <p className="mt-2 text-[var(--color-muted)]">The ultimate challenge from the World Clubs workbook sheet.</p>
              </div>
              <ArrowRight className="mt-1 shrink-0 text-[var(--color-accent)] transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </div>
          </Link>
        </div>
      </section>
    </main>
  );
}
