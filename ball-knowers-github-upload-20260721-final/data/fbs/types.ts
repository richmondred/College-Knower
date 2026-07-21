export type ConferenceId =
  | "acc"
  | "american"
  | "big12"
  | "big-ten"
  | "cusa"
  | "mac"
  | "mountain-west"
  | "pac12"
  | "sec"
  | "sun-belt"
  | "independent";

export type DifficultyId = "easy" | "medium" | "hard";

export type Team = {
  id: string;
  school: string;
  displaySchool: string;
  nickname: string;
  city: string;
  state: string;
  enrollment: number | null;
  conference: ConferenceId;
  formerConferences: string[];
  firstFootballYear: number | null;
  joinedFbs: number | null;
  season: 2026;
  aliases: string[];
  easyAliases: string[];
  mediumAliases: string[];
  hardAnswers: string[];
  cascadeGroup?: string[];
  sourceNotes?: string[];
};

export type QuizDataset = {
  quizId: "fbs-schools-2026";
  datasetVersion: "fbs-2026.1";
  season: 2026;
  title: string;
  generatedAt: string;
  conferences: Record<
    ConferenceId,
    {
      label: string;
      shortLabel: string;
      sortOrder: number;
      expectedTeams: number;
    }
  >;
  teams: Team[];
};

export type DifficultyConfig = {
  id: DifficultyId;
  label: string;
  durationMs: number | null;
  autoSubmit: boolean;
  cascadeMatches: boolean;
  acceptedAliasLevel: "broad" | "standard" | "strict";
  hintsAllowed: boolean;
  clueLimit: number;
  resumable: boolean;
};

export type GameGroup = {
  id: ConferenceId;
  label: string;
  shortLabel: string;
  sortOrder: number;
  totalAnswers: number;
};

export type GameConfig = {
  id: "fbs-schools-2026";
  slug: "fbs-teams";
  title: string;
  shortTitle: string;
  description: string;
  sport: "college-football";
  season: "2026";
  datasetVersion: "fbs-2026.1";
  totalAnswers: number;
  groups: GameGroup[];
  difficulties: DifficultyConfig[];
  leaderboardEnabled: boolean;
};
