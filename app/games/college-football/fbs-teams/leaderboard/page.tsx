import type { Metadata } from "next";
import { LeaderboardView } from "@/components/game/LeaderboardView";

export const metadata: Metadata = {
  title: "FBS 138 Leaderboard",
  description: "Global, country, city and weekly rankings for the 2026 FBS teams quiz."
};

export default function LeaderboardPage() {
  return (
    <main className="game-shell">
      <LeaderboardView />
    </main>
  );
}
