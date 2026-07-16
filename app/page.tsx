import { ArrowRight, Trophy, Zap } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page">
      <p className="eyebrow">ball knowers</p>
      <h1 className="display-title">Know ball, prove it.</h1>
      <p className="lead">
        Pick your sport, pick your quiz, and put your memory under the lights.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link className="button primary" href="/games/college-football">
          <Zap size={18} aria-hidden="true" />
          College football knowers
        </Link>
        <Link className="button" href="/games">
          <Trophy size={18} aria-hidden="true" />
          Browse all knowers
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </main>
  );
}
