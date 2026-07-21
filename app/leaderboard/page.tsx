import type { Metadata } from "next";
import { LeaderboardHub } from "@/components/game/LeaderboardHub";
import { getLeaderboardQuizOptions } from "@/data/leaderboard-options";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Leaderboards for every ball knowers quiz and mode."
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LeaderboardPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = searchParams ? await searchParams : {};

  return (
    <LeaderboardHub
      options={getLeaderboardQuizOptions()}
      initialQuizId={firstParam(params.quiz)}
      initialModeId={firstParam(params.mode)}
    />
  );
}
