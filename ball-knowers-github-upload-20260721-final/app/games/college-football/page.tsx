import { ArrowRight, Trophy } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "College Football Knowers",
  description: "Choose a college football quiz on ball knowers."
};

const quizzes = [
  {
    href: "/games/college-football/fbs-teams",
    title: "All teams quiz",
    description: "Name every 2026 FBS team across every conference.",
    status: "Live",
    icon: Trophy
  },
  {
    href: "/games/college-football/past-champions",
    title: "Past champions quiz",
    description: "Name national champion selections across college football history.",
    status: "Live",
    icon: Trophy
  },
  {
    href: "/games/college-football/heisman-winners",
    title: "Heisman winners quiz",
    description: "Name Heisman winners, with optional runners-up.",
    status: "Live",
    icon: Trophy
  }
];

export default function CollegeFootballPage() {
  return (
    <main className="page">
      <p className="eyebrow">college football knowers</p>
      <h1 className="display-title">College football knowers.</h1>
      <p className="lead">
        Start with the full FBS teams quiz, then test the champions and Heisman lists from the supplied files.
      </p>
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {quizzes.map((quiz) => {
          const Icon = quiz.icon;

          return (
            <Link
              key={quiz.href}
              href={quiz.href}
              className="group rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 no-underline transition-colors hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-2)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] px-2 py-1 text-xs font-black uppercase text-[var(--color-muted)]">
                    <Icon size={14} aria-hidden="true" />
                    {quiz.status}
                  </span>
                  <h2 className="mt-4 text-2xl font-black uppercase">{quiz.title}</h2>
                  <p className="mt-2 text-[var(--color-muted)]">{quiz.description}</p>
                </div>
                <ArrowRight className="mt-1 shrink-0 text-[var(--color-accent)] transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
