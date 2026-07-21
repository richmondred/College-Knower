import type { Metadata } from "next";
import { LeaderboardHub } from "@/components/game/LeaderboardHub";
import { fbsGameConfig } from "@/data/fbs/game-config";
import { getLeaderboardQuizOptions } from "@/data/leaderboard-options";

export const metadata: Metadata = {
  title: "All Teams Quiz Leaderboard",
  description: "Global, country, city and weekly rankings for the 2026 FBS teams quiz."
};

export default function LeaderboardPage() {
  return <LeaderboardHub options={getLeaderboardQuizOptions()} initialQuizId={fbsGameConfig.id} />;
}
