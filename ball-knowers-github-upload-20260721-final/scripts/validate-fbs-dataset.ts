import { fbs2026Dataset, expectedConferenceTotals } from "@/data/fbs/fbs-2026.1";
import { fbsGameConfig } from "@/data/fbs/game-config";
import type { ConferenceId, Team } from "@/data/fbs/types";
import { buildAliasEntries } from "@/lib/quiz/matcher";
import { normaliseAnswer } from "@/lib/quiz/normalise";

const errors: string[] = [];

function fail(message: string): void {
  errors.push(message);
}

function requireField(team: Team, field: keyof Team): void {
  const value = team[field];
  if (value === undefined || value === null || value === "") {
    if (field === "enrollment" || field === "firstFootballYear" || field === "joinedFbs") return;
    fail(`${team.id}: missing required field ${field}`);
  }
}

if (fbs2026Dataset.teams.length !== 138) {
  fail(`Expected 138 teams, found ${fbs2026Dataset.teams.length}`);
}

const expectedTotal = Object.values(expectedConferenceTotals).reduce((sum, count) => sum + count, 0);
if (expectedTotal !== 138) {
  fail(`Expected conference totals should add to 138, got ${expectedTotal}`);
}

const conferenceIds = new Set(Object.keys(fbs2026Dataset.conferences));
const ids = new Map<string, Team>();
const names = new Map<string, Team>();

for (const team of fbs2026Dataset.teams) {
  for (const field of [
    "id",
    "school",
    "displaySchool",
    "nickname",
    "city",
    "state",
    "conference",
    "season",
    "aliases",
    "easyAliases",
    "mediumAliases",
    "hardAnswers"
  ] as const) {
    requireField(team, field);
  }

  if (ids.has(team.id)) fail(`Duplicate team id: ${team.id}`);
  ids.set(team.id, team);

  const normalisedName = normaliseAnswer(team.school);
  if (names.has(normalisedName)) fail(`Duplicate canonical school name: ${team.school}`);
  names.set(normalisedName, team);

  if (!conferenceIds.has(team.conference)) {
    fail(`${team.school}: unknown conference ${team.conference}`);
  }
  if (team.season !== 2026) {
    fail(`${team.school}: season must be 2026`);
  }
}

for (const [conferenceId, expected] of Object.entries(expectedConferenceTotals) as [
  ConferenceId,
  number
][]) {
  const actual = fbs2026Dataset.teams.filter((team) => team.conference === conferenceId).length;
  if (actual !== expected) {
    fail(`${conferenceId}: expected ${expected} teams, found ${actual}`);
  }
  const configured = fbs2026Dataset.conferences[conferenceId].expectedTeams;
  if (configured !== expected) {
    fail(`${conferenceId}: configured expectedTeams ${configured} does not match ${expected}`);
  }
}

for (const level of ["broad", "standard", "strict"] as const) {
  const aliasMap = new Map<string, Set<string>>();
  for (const entry of buildAliasEntries(fbs2026Dataset, level)) {
    const teams = aliasMap.get(entry.normalised) ?? new Set<string>();
    teams.add(entry.teamId);
    aliasMap.set(entry.normalised, teams);
  }
  for (const [alias, teamIds] of aliasMap) {
    if (teamIds.size > 1) {
      fail(`Alias collision at ${level} level for "${alias}": ${[...teamIds].join(", ")}`);
    }
  }
}

const realignmentChecks: Record<string, ConferenceId> = {
  "texas-state": "pac12",
  "louisiana-tech": "sun-belt",
  utep: "mountain-west",
  "north-dakota-state": "mountain-west",
  "northern-illinois": "mountain-west",
  "sacramento-state": "mac",
  massachusetts: "mac"
};

for (const [teamId, expectedConference] of Object.entries(realignmentChecks)) {
  const team = ids.get(teamId);
  if (!team) {
    fail(`Missing realignment-sensitive team ${teamId}`);
  } else if (team.conference !== expectedConference) {
    fail(`${team.school}: expected ${expectedConference}, found ${team.conference}`);
  }
}

if (fbsGameConfig.totalAnswers !== fbs2026Dataset.teams.length) {
  fail(
    `Game config total ${fbsGameConfig.totalAnswers} does not match dataset total ${fbs2026Dataset.teams.length}`
  );
}

if (errors.length) {
  console.error(`FBS dataset validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `FBS dataset ${fbs2026Dataset.datasetVersion} validated: ${fbs2026Dataset.teams.length} teams.`
);
