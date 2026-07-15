import { describe, expect, it, vi } from "vitest";
import { fbsGameConfig } from "@/data/fbs/game-config";
import { difficultyById } from "@/lib/quiz/matcher";
import { computeElapsedMs, computeRemainingMs, createLocalAttempt, formatElapsed, isExpired } from "@/lib/quiz/timer";

describe("timer persistence", () => {
  it("uses absolute deadlines for Medium and Hard", () => {
    const start = Date.parse("2026-09-01T12:00:00Z");
    const medium = createLocalAttempt(difficultyById(fbsGameConfig.difficulties, "medium"), "fbs-schools-2026", "fbs-2026.1", start);
    const hard = createLocalAttempt(difficultyById(fbsGameConfig.difficulties, "hard"), "fbs-schools-2026", "fbs-2026.1", start);
    expect(medium.deadlineAt).toBe(start + 20 * 60 * 1000);
    expect(hard.deadlineAt).toBe(start + 10 * 60 * 1000);
  });

  it("recomputes remaining time from deadline after clock changes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T12:00:00Z"));
    const deadlineAt = Date.parse("2026-09-01T12:15:00Z");
    expect(computeRemainingMs(deadlineAt)).toBe(15 * 60 * 1000);
    vi.advanceTimersByTime(30_000);
    expect(computeRemainingMs(deadlineAt)).toBe(14 * 60 * 1000 + 30_000);
    vi.useRealTimers();
  });

  it("expires and tracks Easy elapsed time", () => {
    expect(isExpired(Date.now() - 1)).toBe(true);
    expect(computeElapsedMs(1000, 2500)).toBe(1500);
    expect(computeRemainingMs(null)).toBeNull();
  });

  it("formats elapsed time through seconds, minutes, hours and days", () => {
    expect(formatElapsed(45_000)).toBe("45s");
    expect(formatElapsed(125_000)).toBe("2m 5s");
    expect(formatElapsed(3_725_000)).toBe("1h 2m 5s");
    expect(formatElapsed(90_125_000)).toBe("1d 1h 2m 5s");
  });
});
