import { fbsGameConfig } from "@/data/fbs/game-config";
import { knowledgeThemes } from "@/data/knowledge/themes";
import type { KnowledgeQuizTheme } from "@/data/knowledge/types";
import { getKnowledgeQuiz } from "@/data/knowledge/quiz-data";
import {
  KNOWLEDGE_LEADERBOARD_VERSION,
  leaderboardModeId,
  leaderboardModeLabel
} from "@/lib/quiz/leaderboard-modes";

export type LeaderboardModeOption = {
  id: string;
  label: string;
};

export type LeaderboardQuizOption = {
  id: string;
  datasetVersion: string;
  label: string;
  shortLabel: string;
  category: string;
  href: string;
  theme: KnowledgeQuizTheme;
  modes: LeaderboardModeOption[];
};

const knowledgeQuizMeta = [
  {
    id: "cfb-past-champions",
    category: "College Football Knowers",
    href: "/games/college-football/past-champions",
    theme: knowledgeThemes.cfb
  },
  {
    id: "cfb-heisman-winners",
    category: "College Football Knowers",
    href: "/games/college-football/heisman-winners",
    theme: knowledgeThemes.cfb
  },
  {
    id: "nfl-all-teams",
    category: "NFL Knowers",
    href: "/games/nfl/all-teams",
    theme: knowledgeThemes.nfl
  },
  {
    id: "nfl-past-champions",
    category: "NFL Knowers",
    href: "/games/nfl/past-champions",
    theme: knowledgeThemes.nfl
  },
  {
    id: "nfl-mvp",
    category: "NFL Knowers",
    href: "/games/nfl/mvp",
    theme: knowledgeThemes.nfl
  },
  {
    id: "english-all-teams",
    category: "English Football Knowers",
    href: "/games/english-football/all-teams",
    theme: knowledgeThemes.english
  },
  {
    id: "english-past-champions",
    category: "English Football Knowers",
    href: "/games/english-football/past-champions",
    theme: knowledgeThemes.english
  },
  {
    id: "europe-all-teams",
    category: "European Football Knowers",
    href: "/games/european-football/all-teams",
    theme: knowledgeThemes.europe
  },
  {
    id: "world-all-clubs",
    category: "World Football Knowers",
    href: "/games/world-football/all-clubs",
    theme: knowledgeThemes.world
  }
] as const;

export function getLeaderboardQuizOptions(): LeaderboardQuizOption[] {
  return [
    {
      id: fbsGameConfig.id,
      datasetVersion: fbsGameConfig.datasetVersion,
      label: "College Football All Teams Quiz",
      shortLabel: "CFB All Teams",
      category: "College Football Knowers",
      href: "/games/college-football/fbs-teams",
      theme: knowledgeThemes.cfb,
      modes: fbsGameConfig.difficulties.map((difficulty) => ({
        id: difficulty.id,
        label: difficulty.label
      }))
    },
    ...knowledgeQuizMeta.map((meta) => {
      const quiz = getKnowledgeQuiz(meta.id);
      const modes = quiz.modes.flatMap((mode) => [
        {
          id: mode.id,
          label: mode.label
        },
        ...(quiz.runnerUpToggle
          ? [
              {
                id: leaderboardModeId(mode.id, true),
                label: leaderboardModeLabel(mode.label, true)
              }
            ]
          : [])
      ]);

      return {
        id: quiz.id,
        datasetVersion: KNOWLEDGE_LEADERBOARD_VERSION,
        label: quiz.title,
        shortLabel: quiz.title
          .replace("College Football ", "CFB ")
          .replace(" Quiz", ""),
        category: meta.category,
        href: meta.href,
        theme: meta.theme,
        modes
      };
    })
  ];
}
