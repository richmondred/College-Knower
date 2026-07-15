import { Trophy, Zap } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page">
      <p className="eyebrow">collegeknower</p>
      <h1 className="display-title">Know the board.</h1>
      <p className="lead">
        A fast college football quiz platform built around the 2026 FBS alignment.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link className="button primary" href="/games/college-football/fbs-teams">
          <Zap size={18} aria-hidden="true" />
          Play FBS 138
        </Link>
        <Link className="button" href="/games">
          <Trophy size={18} aria-hidden="true" />
          Browse games
        </Link>
      </div>
    </main>
  );
}
