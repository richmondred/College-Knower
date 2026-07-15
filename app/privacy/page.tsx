import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Privacy information for collegeknower."
};

export default function PrivacyPage() {
  return (
    <main className="page">
      <article className="legal-panel">
        <p className="eyebrow">Privacy</p>
        <h1 className="display-title">Clear by default.</h1>
        <div className="grid gap-4 text-[var(--color-muted)]">
          <p>
            You can play without registering. Active attempts, local history and draft profile fields
            are stored in your browser when Supabase is not configured.
          </p>
          <p>
            If you submit to a public leaderboard, your display name, country and visible city may be
            shown publicly with your score, difficulty, completion time and submission date.
          </p>
          <p>
            City is optional. Do not enter a postcode, street address or precise location. Email
            addresses are not displayed publicly and are not required for this first version.
          </p>
          <p>
            Security and anti-abuse signals should be kept in private database tables, separate from
            public leaderboard records. Pseudonymous identifiers can still be personal data, so they
            should have short retention and restricted access.
          </p>
          <p>
            Players should be able to edit or delete their profile fields and remove leaderboard
            entries where legally and technically appropriate.
          </p>
        </div>
      </article>
    </main>
  );
}
