import { ArrowRight, Trophy, Zap } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="page home-page">
      <p className="eyebrow">ball knowers</p>
      <h1 className="display-title">Know ball, prove it.</h1>
      <p className="lead">
        Pick your sport, pick your quiz, and put your memory under the lights.
      </p>
      <a className="coffee-button" href="https://www.buymeacoffee.com/tjkatsidb" target="_blank" rel="noreferrer">
        <Image
          src="https://cdn.buymeacoffee.com/buttons/v2/default-red.png"
          alt="Buy Me a Coffee"
          width={217}
          height={60}
          unoptimized
        />
      </a>
      <div className="home-actions mt-8 flex flex-wrap gap-3">
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
