import type { DifficultyConfig, DifficultyId, QuizDataset, Team } from "@/data/fbs/types";
import { normaliseAnswer } from "./normalise";

export type AliasLevel = "broad" | "standard" | "strict";

export type AliasEntry = {
  normalised: string;
  raw: string;
  teamId: string;
  level: AliasLevel;
};

export type MatchResult = {
  acceptedTeamIds: string[];
  exactTeamIds: string[];
  alreadySolvedTeamIds: string[];
  shouldHoldInput: boolean;
  normalisedInput: string;
  feedback: string;
};

export type ResolveOptions = {
  dataset: QuizDataset;
  difficulty: DifficultyConfig;
  solvedTeamIds: Set<string>;
  submitted?: boolean;
};

const entryCache = new WeakMap<QuizDataset, Partial<Record<AliasLevel, AliasEntry[]>>>();
const indexCache = new WeakMap<QuizDataset, Partial<Record<AliasLevel, Map<string, AliasEntry[]>>>>();

function aliasesForTeam(team: Team, level: AliasLevel): string[] {
  if (level === "broad") return team.easyAliases;
  if (level === "standard") return team.mediumAliases;
  return team.hardAnswers;
}

export function buildAliasEntries(dataset: QuizDataset, level: AliasLevel): AliasEntry[] {
  const cachedLevels = entryCache.get(dataset) ?? {};
  const cached = cachedLevels[level];
  if (cached) return cached;

  const entries = dataset.teams.flatMap((team) =>
    aliasesForTeam(team, level)
      .map((raw) => ({
        normalised: normaliseAnswer(raw),
        raw,
        teamId: team.id,
        level
      }))
      .filter((entry) => entry.normalised.length > 0)
  );
  cachedLevels[level] = entries;
  entryCache.set(dataset, cachedLevels);
  return entries;
}

export function buildAliasIndex(dataset: QuizDataset, level: AliasLevel): Map<string, AliasEntry[]> {
  const cachedLevels = indexCache.get(dataset) ?? {};
  const cached = cachedLevels[level];
  if (cached) return cached;

  const index = new Map<string, AliasEntry[]>();
  for (const entry of buildAliasEntries(dataset, level)) {
    const existing = index.get(entry.normalised) ?? [];
    existing.push(entry);
    index.set(entry.normalised, existing);
  }
  cachedLevels[level] = index;
  indexCache.set(dataset, cachedLevels);
  return index;
}

function groupsFor(dataset: QuizDataset, teamId: string): string[] {
  return dataset.teams.find((team) => team.id === teamId)?.cascadeGroup ?? [];
}

function canCascadePrefix(dataset: QuizDataset, prefixTeamId: string, exactTeamIds: string[]): boolean {
  const groups = groupsFor(dataset, prefixTeamId);
  return exactTeamIds.some(
    (id) =>
      id !== prefixTeamId &&
      groups.some((group) => groupsFor(dataset, id).includes(group))
  );
}

function longerUnsolvedAliasExists(
  entries: AliasEntry[],
  input: string,
  solvedTeamIds: Set<string>
): boolean {
  if (!input) return false;
  return entries.some(
    (entry) =>
      !solvedTeamIds.has(entry.teamId) &&
      entry.normalised.length > input.length &&
      entry.normalised.startsWith(`${input} `)
  );
}

export function resolveAnswer(raw: string, options: ResolveOptions): MatchResult {
  const normalisedInput = normaliseAnswer(raw);
  const level = options.difficulty.acceptedAliasLevel;
  const entries = buildAliasEntries(options.dataset, level);
  const index = buildAliasIndex(options.dataset, level);
  const exactEntries = index.get(normalisedInput) ?? [];
  const exactTeamIds = Array.from(new Set(exactEntries.map((entry) => entry.teamId)));

  if (options.difficulty.id === "hard" && !options.submitted) {
    return {
      acceptedTeamIds: [],
      exactTeamIds,
      alreadySolvedTeamIds: exactTeamIds.filter((id) => options.solvedTeamIds.has(id)),
      shouldHoldInput: false,
      normalisedInput,
      feedback: normalisedInput ? "Press Enter to submit." : ""
    };
  }

  const accepted = new Set<string>();
  for (const id of exactTeamIds) {
    if (!options.solvedTeamIds.has(id)) accepted.add(id);
  }

  if (options.difficulty.cascadeMatches && normalisedInput) {
    for (const entry of entries) {
      if (
        !options.solvedTeamIds.has(entry.teamId) &&
        entry.normalised.length < normalisedInput.length &&
        normalisedInput.startsWith(`${entry.normalised} `) &&
        canCascadePrefix(options.dataset, entry.teamId, exactTeamIds)
      ) {
        accepted.add(entry.teamId);
      }
    }
  }

  const acceptedTeamIds = Array.from(accepted).sort((a, b) => {
    const aName = options.dataset.teams.find((team) => team.id === a)?.school ?? a;
    const bName = options.dataset.teams.find((team) => team.id === b)?.school ?? b;
    return bName.length - aName.length;
  });

  const alreadySolvedTeamIds = exactTeamIds.filter((id) => options.solvedTeamIds.has(id));
  const shouldHoldInput =
    options.difficulty.cascadeMatches &&
    normalisedInput.length > 0 &&
    longerUnsolvedAliasExists(entries, normalisedInput, options.solvedTeamIds);

  let feedback = "";
  if (acceptedTeamIds.length > 0) {
    feedback =
      acceptedTeamIds.length === 1
        ? "Accepted."
        : `${acceptedTeamIds.length} teams accepted through cascading recognition.`;
  } else if (alreadySolvedTeamIds.length > 0 && shouldHoldInput) {
    feedback = "Already found. Keep typing for the longer school.";
  } else if (shouldHoldInput) {
    feedback = "Keep typing to finish the school name.";
  } else if (normalisedInput && options.difficulty.id === "hard" && options.submitted) {
    feedback = "No exact Hard-mode answer found.";
  }

  return {
    acceptedTeamIds,
    exactTeamIds,
    alreadySolvedTeamIds,
    shouldHoldInput,
    normalisedInput,
    feedback
  };
}

export function findTeam(dataset: QuizDataset, teamId: string): Team {
  const team = dataset.teams.find((candidate) => candidate.id === teamId);
  if (!team) {
    throw new Error(`Unknown team id: ${teamId}`);
  }
  return team;
}

export function difficultyById(
  difficulties: readonly DifficultyConfig[],
  id: DifficultyId
): DifficultyConfig {
  const difficulty = difficulties.find((candidate) => candidate.id === id);
  if (!difficulty) {
    throw new Error(`Unknown difficulty: ${id}`);
  }
  return difficulty;
}
