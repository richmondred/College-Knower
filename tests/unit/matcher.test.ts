import { describe, expect, it } from "vitest";
import { fbs2026Dataset } from "@/data/fbs/fbs-2026.1";
import { fbsGameConfig } from "@/data/fbs/game-config";
import { difficultyById, resolveAnswer } from "@/lib/quiz/matcher";
import { normaliseAnswer } from "@/lib/quiz/normalise";

const easy = difficultyById(fbsGameConfig.difficulties, "easy");
const medium = difficultyById(fbsGameConfig.difficulties, "medium");
const hard = difficultyById(fbsGameConfig.difficulties, "hard");

describe("normaliseAnswer", () => {
  it("normalises punctuation, spacing and ampersands", () => {
    expect(normaliseAnswer("  Texas  A&M ")).toBe("texas a and m");
    expect(normaliseAnswer("N.C. State")).toBe("nc state");
    expect(normaliseAnswer("Miami-FL")).toBe("miami fl");
  });

  it("normalises Hawaii variants", () => {
    expect(normaliseAnswer("Hawaiʻi")).toBe(normaliseAnswer("Hawaii"));
    expect(normaliseAnswer("Hawai'i")).toBe(normaliseAnswer("Hawaii"));
  });
});

describe("resolveAnswer", () => {
  it("never scores duplicates twice", () => {
    const solved = new Set(["texas"]);
    const result = resolveAnswer("Texas", { dataset: fbs2026Dataset, difficulty: easy, solvedTeamIds: solved });
    expect(result.acceptedTeamIds).toEqual([]);
    expect(result.alreadySolvedTeamIds).toEqual(["texas"]);
  });

  it("cascades Texas A&M in Easy and Medium", () => {
    expect(resolveAnswer("Texas A&M", { dataset: fbs2026Dataset, difficulty: easy, solvedTeamIds: new Set() }).acceptedTeamIds).toEqual(["texas-am", "texas"]);
    expect(resolveAnswer("Texas A&M", { dataset: fbs2026Dataset, difficulty: medium, solvedTeamIds: new Set() }).acceptedTeamIds).toEqual(["texas-am", "texas"]);
  });

  it("does not cascade in Hard mode", () => {
    expect(resolveAnswer("Texas A&M", { dataset: fbs2026Dataset, difficulty: hard, solvedTeamIds: new Set(), submitted: true }).acceptedTeamIds).toEqual(["texas-am"]);
  });

  it("holds an already-solved prefix so the player can continue typing", () => {
    const result = resolveAnswer("Texas", { dataset: fbs2026Dataset, difficulty: easy, solvedTeamIds: new Set(["texas"]) });
    expect(result.shouldHoldInput).toBe(true);
  });

  it("accepts plain Miami for Miami (FL) while keeping Miami (OH) explicit", () => {
    expect(resolveAnswer("Miami", { dataset: fbs2026Dataset, difficulty: easy, solvedTeamIds: new Set() }).acceptedTeamIds).toEqual(["miami-fl"]);
    expect(resolveAnswer("Miami FL", { dataset: fbs2026Dataset, difficulty: easy, solvedTeamIds: new Set() }).acceptedTeamIds).toEqual(["miami-fl"]);
    expect(resolveAnswer("Miami OH", { dataset: fbs2026Dataset, difficulty: easy, solvedTeamIds: new Set() }).acceptedTeamIds).toEqual(["miami-oh"]);
  });

  it("accepts st as a state abbreviation", () => {
    expect(resolveAnswer("Arizona St", { dataset: fbs2026Dataset, difficulty: easy, solvedTeamIds: new Set() }).acceptedTeamIds).toEqual(["arizona-state", "arizona"]);
    expect(resolveAnswer("Kansas St", { dataset: fbs2026Dataset, difficulty: medium, solvedTeamIds: new Set() }).acceptedTeamIds).toEqual(["kansas-state", "kansas"]);
    expect(resolveAnswer("San Jose St", { dataset: fbs2026Dataset, difficulty: hard, solvedTeamIds: new Set(), submitted: true }).acceptedTeamIds).toEqual(["san-jose-state"]);
  });

  it("keeps USC and South Carolina distinct", () => {
    expect(resolveAnswer("USC", { dataset: fbs2026Dataset, difficulty: easy, solvedTeamIds: new Set() }).acceptedTeamIds).toEqual(["usc"]);
    expect(resolveAnswer("South Carolina", { dataset: fbs2026Dataset, difficulty: easy, solvedTeamIds: new Set() }).acceptedTeamIds).toEqual(["south-carolina"]);
  });

  it("does not award Texas from North Texas", () => {
    expect(resolveAnswer("North Texas", { dataset: fbs2026Dataset, difficulty: easy, solvedTeamIds: new Set() }).acceptedTeamIds).toEqual(["north-texas"]);
  });

  it.each([
    ["Louisiana Tech", ["louisiana-tech", "louisiana"]],
    ["Florida Atlantic", ["florida-atlantic", "florida"]],
    ["New Mexico State", ["new-mexico-state", "new-mexico"]],
    ["Ohio State", ["ohio-state", "ohio"]]
  ])("supports explicit prefix family %s", (answer, expected) => {
    expect(resolveAnswer(answer, { dataset: fbs2026Dataset, difficulty: easy, solvedTeamIds: new Set() }).acceptedTeamIds).toEqual(expected);
  });
});
