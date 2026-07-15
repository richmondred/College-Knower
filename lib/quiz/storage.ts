import type { DifficultyId } from "@/data/fbs/types";
import type { LeaderboardEntry } from "./leaderboard";
import type { ActiveAttemptState } from "./timer";

export const STORAGE_VERSION = 1;

export type StoredHistoryEntry = {
  id: string;
  quizId: string;
  datasetVersion: string;
  difficulty: DifficultyId;
  score: number;
  total: number;
  percentage: number;
  elapsedMs: number;
  completed: boolean;
  conferencesCompleted: number;
  hintCount: number;
  resumed: boolean;
  eligible: boolean;
  createdAt: string;
};

function key(parts: string[]): string {
  return ["sportsQuiz", `v${STORAGE_VERSION}`, ...parts].join(":");
}

export function attemptStorageKey(quizId: string, datasetVersion: string, difficulty: DifficultyId): string {
  return key(["attempt", quizId, datasetVersion, difficulty]);
}

export function historyStorageKey(quizId: string, datasetVersion: string): string {
  return key(["history", quizId, datasetVersion]);
}

export function leaderboardStorageKey(quizId: string, datasetVersion: string, difficulty: DifficultyId): string {
  return key(["leaderboard", quizId, datasetVersion, difficulty]);
}

export function loadJson<T>(storageKey: string): T | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    window.localStorage.removeItem(storageKey);
    return null;
  }
}

export function saveJson<T>(storageKey: string, value: T): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey, JSON.stringify(value));
}

export function removeJson(storageKey: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(storageKey);
}

export function loadAttempt(storageKey: string): ActiveAttemptState | null {
  return loadJson<ActiveAttemptState>(storageKey);
}

export function appendHistory(storageKey: string, entry: StoredHistoryEntry): void {
  const current = loadJson<StoredHistoryEntry[]>(storageKey) ?? [];
  saveJson(storageKey, [entry, ...current].slice(0, 50));
}

export function saveLocalLeaderboard(storageKey: string, entry: LeaderboardEntry): LeaderboardEntry[] {
  const current = loadJson<LeaderboardEntry[]>(storageKey) ?? [];
  const withoutDuplicateAttempt = current.filter((candidate) => candidate.attemptId !== entry.attemptId);
  const next = [entry, ...withoutDuplicateAttempt];
  saveJson(storageKey, next);
  return next;
}
