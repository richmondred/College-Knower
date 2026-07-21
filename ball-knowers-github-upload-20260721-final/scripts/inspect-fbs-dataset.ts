import { readFileSync } from "fs";
import { resolve } from "path";
import type { QuizDataset } from "@/data/fbs/types";

const input = process.argv[2];
if (!input) {
  console.error("Usage: pnpm data:inspect path/to/dataset.json");
  process.exit(1);
}

const dataset = JSON.parse(readFileSync(resolve(input), "utf8")) as QuizDataset;
const conferences = Object.entries(dataset.conferences)
  .sort(([, a], [, b]) => a.sortOrder - b.sortOrder)
  .map(([id, conference]) => ({
    id,
    label: conference.label,
    expected: conference.expectedTeams,
    actual: dataset.teams.filter((team) => team.conference === id).length
  }));

console.log(JSON.stringify({
  quizId: dataset.quizId,
  datasetVersion: dataset.datasetVersion,
  season: dataset.season,
  teams: dataset.teams.length,
  conferences
}, null, 2));
