import { ArrowRight, Trophy } from "lucide-react";
import Link from "next/link";
import { knowledgeThemes, quizThemeStyle } from "@/data/knowledge/themes";

export const metadata = {
  title: "NFL Knowers",
  description: "Choose an NFL quiz on ball knowers."
};

const quizzes = [
  {
    href: "/games/nfl/all-teams",
    title: "All teams quiz",
    description: "Name all 32 NFL teams."
  },
  {
    href: "/games/nfl/past-champions",
    title: "Past champions quiz",
    description: "Name every Super Bowl champion."
  },
  {
    href: "/games/nfl/mvp",
    title: "MVP quiz",
    description: "Name AP NFL MVP winners."
  }
];

export default function NflKnowersPage() {
  return (
    <main className="knowledge-shell" style={quizThemeStyle(knowledgeThemes.nfl)}>
      <section className="page">
        <p className="eyebrow">NFL knowers</p>
        <h1 className="display-title">NFL knowers.</h1>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <Link
              key={quiz.href}
              href={quiz.href}
              className="group rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 no-underline transition-colors hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-2)]"
            >
              <span className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] px-2 py-1 text-xs font-black uppercase text-[var(--color-muted)]">
                <Trophy size={14} aria-hidden="true" />
                Live
              </span>
              <div className="mt-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black uppercase">{quiz.title}</h2>
                  <p className="mt-2 text-[var(--color-muted)]">{quiz.description}</p>
                </div>
                <ArrowRight className="mt-1 shrink-0 text-[var(--color-accent)] transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
