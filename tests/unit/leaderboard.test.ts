import { describe, expect, it } from "vitest";
import { bestPublicEntries, compareLeaderboardEntries, type LeaderboardEntry } from "@/lib/quiz/leaderboard";

const base: LeaderboardEntry = {
  id: "entry",
  attemptId: "attempt",
  profileId: "profile",
  quizId: "fbs-schools-2026",
  datasetVersion: "fbs-2026.1",
  difficulty: "medium",
  displayName: "Player",
  city: null,
  showCity: true,
  countryCode: "US",
  score: 100,
  total: 138,
  completionMs: 600_000,
  completed: false,
  verified: true,
  moderationState: "visible",
  createdAt: "2026-09-01T12:00:00.000Z",
  updatedAt: "2026-09-01T12:00:00.000Z"
};

describe("leaderboard ranking", () => {
  it("ranks completed attempts before incomplete attempts", () => {
    const complete = { ...base, id: "complete", completed: true, score: 138 };
    expect(compareLeaderboardEntries(complete, base)).toBeLessThan(0);
  });

  it("ranks higher score and faster completion first", () => {
    const higher = { ...base, id: "higher", score: 120 };
    const faster = { ...base, id: "faster", completed: true, score: 138, completionMs: 400_000 };
    const slower = { ...base, id: "slower", completed: true, score: 138, completionMs: 500_000 };
    expect(compareLeaderboardEntries(higher, base)).toBeLessThan(0);
    expect(compareLeaderboardEntries(faster, slower)).toBeLessThan(0);
  });

  it("keeps one best public result per profile", () => {
    const worse = { ...base, id: "worse", profileId: "same", score: 80 };
    const better = { ...base, id: "better", profileId: "same", score: 100 };
    const hidden = { ...base, id: "hidden", profileId: "hidden", score: 138, moderationState: "hidden" as const };
    expect(bestPublicEntries([worse, better, hidden]).map((entry) => entry.id)).toEqual(["better"]);
  });
});
