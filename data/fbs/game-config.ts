import { fbs2026Dataset } from "./fbs-2026.1";
import type { GameConfig } from "./types";

export const fbsGameConfig: GameConfig = {
  id: "fbs-schools-2026",
  slug: "fbs-teams",
  title: fbs2026Dataset.title,
  shortTitle: "FBS 138",
  description:
    "Can you name all 138 FBS college football teams in the 2026 alignment?",
  sport: "college-football",
  season: "2026",
  datasetVersion: "fbs-2026.1",
  totalAnswers: fbs2026Dataset.teams.length,
  groups: Object.entries(fbs2026Dataset.conferences)
    .map(([id, conference]) => ({
      id: id as keyof typeof fbs2026Dataset.conferences,
      label: conference.label,
      shortLabel: conference.shortLabel,
      sortOrder: conference.sortOrder,
      totalAnswers: conference.expectedTeams
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder),
  difficulties: [
    {
      id: "easy",
      label: "Casual",
      durationMs: null,
      autoSubmit: true,
      cascadeMatches: true,
      acceptedAliasLevel: "broad",
      hintsAllowed: true,
      clueLimit: 20,
      resumable: true
    },
    {
      id: "medium",
      label: "Fan",
      durationMs: 20 * 60 * 1000,
      autoSubmit: true,
      cascadeMatches: true,
      acceptedAliasLevel: "standard",
      hintsAllowed: true,
      clueLimit: 10,
      resumable: false
    },
    {
      id: "hard",
      label: "Ball Knower",
      durationMs: 10 * 60 * 1000,
      autoSubmit: false,
      cascadeMatches: false,
      acceptedAliasLevel: "strict",
      hintsAllowed: false,
      clueLimit: 0,
      resumable: false
    }
  ],
  leaderboardEnabled: true
};
