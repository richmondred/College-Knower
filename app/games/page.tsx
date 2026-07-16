import { ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Knowers",
  description: "Choose a ball knowers category."
};

const categories = [
  {
    href: "/games/college-football",
    title: "College football knowers",
    description: "All teams quiz is live now."
  },
  {
    href: "/games/nfl",
    title: "NFL knowers",
    description: "coming soon hehe"
  },
  {
    href: "/games/english-football",
    title: "English football knowers",
    description: "coming soon hehe"
  },
  {
    href: "/games/european-football",
    title: "European football knowers",
    description: "coming soon hehe"
  },
  {
    href: "/games/world-football",
    title: "World football knowers",
    description: "coming soon hehe"
  }
];

export default function GamesPage() {
  return (
    <main className="page">
      <p className="eyebrow">ball knowers</p>
      <h1 className="display-title">Pick your lane.</h1>
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.href}
            href={category.href}
            className="group rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5 no-underline transition-colors hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-2)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black uppercase">{category.title}</h2>
                <p className="mt-2 text-[var(--color-muted)]">{category.description}</p>
              </div>
              <ArrowRight className="mt-1 shrink-0 text-[var(--color-accent)] transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
