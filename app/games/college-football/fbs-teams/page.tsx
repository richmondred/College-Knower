import type { Metadata } from "next";
import { FbsQuizGame } from "@/components/game/FbsQuizGame";
import { fbsGameConfig } from "@/data/fbs/game-config";

export const metadata: Metadata = {
  title: "Name Every FBS College Football Team",
  description:
    "Can you name all 138 FBS college football teams in the 2026 alignment? Choose Easy, Medium or Hard and compare your score on the leaderboard.",
  alternates: {
    canonical: "/games/college-football/fbs-teams"
  },
  openGraph: {
    title: `Name Every FBS College Football Team | ${fbsGameConfig.shortTitle}`,
    description:
      "Can you name all 138 FBS college football teams in the 2026 alignment?",
    type: "website"
  },
  twitter: {
    card: "summary_large_image"
  }
};

export default function FbsTeamsPage() {
  return <FbsQuizGame />;
}
