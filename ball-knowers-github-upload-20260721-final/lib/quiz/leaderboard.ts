import type { DifficultyId } from "@/data/fbs/types";

export type LeaderboardEntry = {
  id: string;
  attemptId: string;
  profileId: string;
  quizId: string;
  datasetVersion: string;
  difficulty: DifficultyId;
  displayName: string;
  city: string | null;
  showCity: boolean;
  countryCode: string;
  score: number;
  total: number;
  completionMs: number | null;
  completed: boolean;
  verified: boolean;
  moderationState: "visible" | "hidden" | "flagged";
  createdAt: string;
  updatedAt: string;
};

export function compareLeaderboardEntries(a: LeaderboardEntry, b: LeaderboardEntry): number {
  if (a.completed !== b.completed) return a.completed ? -1 : 1;
  if (a.score !== b.score) return b.score - a.score;
  const aTime = a.completionMs ?? Number.MAX_SAFE_INTEGER;
  const bTime = b.completionMs ?? Number.MAX_SAFE_INTEGER;
  if (aTime !== bTime) return aTime - bTime;
  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

export function visibleEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return entries.filter((entry) => entry.moderationState === "visible" && entry.verified);
}

export function bestPublicEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  const best = new Map<string, LeaderboardEntry>();
  for (const entry of visibleEntries(entries)) {
    const key = `${entry.profileId}:${entry.quizId}:${entry.datasetVersion}:${entry.difficulty}`;
    const current = best.get(key);
    if (!current || compareLeaderboardEntries(entry, current) < 0) {
      best.set(key, entry);
    }
  }
  return [...best.values()].sort(compareLeaderboardEntries);
}

export function countryFlag(countryCode: string): string {
  if (!/^[A-Z]{2}$/.test(countryCode)) return "";
  const points = [...countryCode].map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...points);
}
