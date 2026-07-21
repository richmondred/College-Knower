import { fbs2026Dataset } from "@/data/fbs/fbs-2026.1";
import { fbsGameConfig } from "@/data/fbs/game-config";
import { getKnowledgeQuiz } from "@/data/knowledge/quiz-data";
import type { KnowledgeQuiz, KnowledgeQuizEntry } from "@/data/knowledge/types";
import {
  KNOWLEDGE_LEADERBOARD_VERSION,
  RUNNER_UP_MODE_SUFFIX
} from "@/lib/quiz/leaderboard-modes";

export type RegisteredQuizMode = {
  id: string;
  label: string;
  answerIds: string[];
  total: number;
};

export type RegisteredQuiz = {
  id: string;
  datasetVersion: string;
  title: string;
  mode: RegisteredQuizMode;
};

function parseKnowledgeMode(modeId: string) {
  const suffix = `-${RUNNER_UP_MODE_SUFFIX}`;
  if (!modeId.endsWith(suffix)) return { baseModeId: modeId, includeRunnerUps: false };
  return {
    baseModeId: modeId.slice(0, -suffix.length),
    includeRunnerUps: true
  };
}

function knowledgeEntriesForMode(
  quiz: KnowledgeQuiz,
  modeId: string
): { modeLabel: string; entries: KnowledgeQuizEntry[] } | null {
  const { baseModeId, includeRunnerUps } = parseKnowledgeMode(modeId);
  const mode = quiz.modes.find((candidate) => candidate.id === baseModeId);
  if (!mode) return null;

  return {
    modeLabel: includeRunnerUps ? `${mode.label} + Runners Up` : mode.label,
    entries: quiz.entries.filter(
      (entry) =>
        entry.modeIds.includes(mode.id) &&
        (!entry.runnerUp || includeRunnerUps)
    )
  };
}

export function getRegisteredQuiz(
  quizId: string,
  datasetVersion: string,
  modeId: string
): RegisteredQuiz | null {
  if (quizId === fbsGameConfig.id && datasetVersion === fbsGameConfig.datasetVersion) {
    const difficulty = fbsGameConfig.difficulties.find((candidate) => candidate.id === modeId);
    if (!difficulty) return null;
    const answerIds = fbs2026Dataset.teams.map((team) => team.id);
    return {
      id: fbsGameConfig.id,
      datasetVersion: fbsGameConfig.datasetVersion,
      title: fbsGameConfig.title,
      mode: {
        id: difficulty.id,
        label: difficulty.label,
        answerIds,
        total: answerIds.length
      }
    };
  }

  if (datasetVersion !== KNOWLEDGE_LEADERBOARD_VERSION) return null;

  try {
    const quiz = getKnowledgeQuiz(quizId);
    const result = knowledgeEntriesForMode(quiz, modeId);
    if (!result) return null;
    const answerIds = result.entries.map((entry) => entry.id);
    return {
      id: quiz.id,
      datasetVersion,
      title: quiz.title,
      mode: {
        id: modeId,
        label: result.modeLabel,
        answerIds,
        total: answerIds.length
      }
    };
  } catch {
    return null;
  }
}
