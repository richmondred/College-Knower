import type { DifficultyConfig, DifficultyId } from "@/data/fbs/types";

export type ActiveAttemptState = {
  attemptId: string;
  quizId: string;
  datasetVersion: string;
  difficulty: DifficultyId;
  startedAt: number;
  deadlineAt: number | null;
  solvedTeamIds: string[];
  hintTeamIds: string[];
  hintCount: number;
  lastUpdatedAt: number;
  answerEvents: AnswerEvent[];
  resumed: boolean;
};

export type AnswerEvent = {
  teamId: string;
  clientTs: number;
  sequence: number;
  difficulty: DifficultyId;
  attemptId: string;
};

export function createLocalAttempt(
  difficulty: DifficultyConfig,
  quizId: string,
  datasetVersion: string,
  now = Date.now()
): ActiveAttemptState {
  return {
    attemptId: cryptoSafeId(),
    quizId,
    datasetVersion,
    difficulty: difficulty.id,
    startedAt: now,
    deadlineAt: difficulty.durationMs === null ? null : now + difficulty.durationMs,
    solvedTeamIds: [],
    hintTeamIds: [],
    hintCount: 0,
    lastUpdatedAt: now,
    answerEvents: [],
    resumed: false
  };
}

export function computeRemainingMs(deadlineAt: number | null, now = Date.now()): number | null {
  if (deadlineAt === null) return null;
  return Math.max(0, deadlineAt - now);
}

export function computeElapsedMs(startedAt: number, now = Date.now()): number {
  return Math.max(0, now - startedAt);
}

export function isExpired(deadlineAt: number | null, now = Date.now()): boolean {
  return deadlineAt !== null && computeRemainingMs(deadlineAt, now) === 0;
}

export function formatClock(ms: number | null): string {
  if (ms === null) return "Untimed";
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function cryptoSafeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `attempt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
