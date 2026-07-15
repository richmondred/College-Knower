import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms for collegeknower."
};

export default function TermsPage() {
  return (
    <main className="page">
      <article className="legal-panel">
        <p className="eyebrow">Terms</p>
        <h1 className="display-title">Fair play, clean boards.</h1>
        <div className="grid gap-4 text-[var(--color-muted)]">
          <p>
            The quiz is for entertainment and sports knowledge. Do not submit automated, forged or
            abusive attempts to public leaderboards.
          </p>
          <p>
            Leaderboard entries can be hidden, flagged or removed for abuse, impossible timings,
            impersonation or offensive public profile fields.
          </p>
          <p>
            Team, conference and university names are used descriptively. This project does not use or
            claim ownership of official marks, logos, helmets or photography.
          </p>
        </div>
      </article>
    </main>
  );
}
