import { describe, expect, it } from "vitest";
import { expectedConferenceTotals, fbs2026Dataset } from "@/data/fbs/fbs-2026.1";
import { fbsGameConfig } from "@/data/fbs/game-config";
import { buildAliasEntries } from "@/lib/quiz/matcher";
import { normaliseAnswer } from "@/lib/quiz/normalise";

describe("fbs-2026.1 dataset", () => {
  it("contains exactly 138 teams", () => {
    expect(fbs2026Dataset.teams).toHaveLength(138);
    expect(fbsGameConfig.totalAnswers).toBe(138);
  });

  it("matches expected conference counts", () => {
    for (const [conference, expected] of Object.entries(expectedConferenceTotals)) {
      expect(fbs2026Dataset.teams.filter((team) => team.conference === conference)).toHaveLength(expected);
    }
  });

  it("has no duplicate ids or canonical names", () => {
    const ids = new Set(fbs2026Dataset.teams.map((team) => team.id));
    const names = new Set(fbs2026Dataset.teams.map((team) => normaliseAnswer(team.school)));
    expect(ids.size).toBe(fbs2026Dataset.teams.length);
    expect(names.size).toBe(fbs2026Dataset.teams.length);
  });

  it("has no unexplained alias collisions", () => {
    for (const level of ["broad", "standard", "strict"] as const) {
      const map = new Map<string, Set<string>>();
      for (const entry of buildAliasEntries(fbs2026Dataset, level)) {
        const teams = map.get(entry.normalised) ?? new Set<string>();
        teams.add(entry.teamId);
        map.set(entry.normalised, teams);
      }
      const collisions = [...map.entries()].filter(([, teams]) => teams.size > 1);
      expect(collisions).toEqual([]);
    }
  });

  it("places realignment-sensitive teams in their corrected 2026 conferences", () => {
    expect(teamConference("texas-state")).toBe("pac12");
    expect(teamConference("louisiana-tech")).toBe("sun-belt");
    expect(teamConference("utep")).toBe("mountain-west");
    expect(teamConference("north-dakota-state")).toBe("mountain-west");
    expect(teamConference("northern-illinois")).toBe("mountain-west");
    expect(teamConference("sacramento-state")).toBe("mac");
    expect(teamConference("massachusetts")).toBe("mac");
  });
});

function teamConference(id: string): string {
  return fbs2026Dataset.teams.find((team) => team.id === id)?.conference ?? "missing";
}
