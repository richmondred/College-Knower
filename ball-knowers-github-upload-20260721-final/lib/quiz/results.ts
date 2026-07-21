import type { ConferenceId, DifficultyId, QuizDataset } from "@/data/fbs/types";
import type { AnswerEvent } from "./timer";

export type ConferenceResult = {
  conference: ConferenceId;
  label: string;
  solved: number;
  total: number;
  completed: boolean;
  missedTeamIds: string[];
  completedAtMs: number | null;
};

export type AttemptSummary = {
  score: number;
  total: number;
  percentage: number;
  completed: boolean;
  conferencesCompleted: number;
  bestConference: ConferenceResult | null;
  weakestConference: ConferenceResult | null;
  conferenceResults: ConferenceResult[];
  firstCorrectMs: number | null;
  lastCorrectMs: number | null;
  longestGapMs: number | null;
  finalMinuteScore: number;
  answersPerMinute: number;
};

export function summariseAttempt(params: {
  dataset: QuizDataset;
  solvedTeamIds: string[];
  answerEvents: AnswerEvent[];
  startedAt: number;
  finishedAt: number;
}): AttemptSummary {
  const solved = new Set(params.solvedTeamIds);
  const eventsByTeam = new Map(params.answerEvents.map((event) => [event.teamId, event]));
  const conferenceResults = Object.entries(params.dataset.conferences)
    .map(([conferenceId, conference]) => {
      const teams = params.dataset.teams.filter((team) => team.conference === conferenceId);
      const missedTeamIds = teams.filter((team) => !solved.has(team.id)).map((team) => team.id);
      const solvedEvents = teams
        .map((team) => eventsByTeam.get(team.id))
        .filter((event): event is AnswerEvent => Boolean(event))
        .sort((a, b) => a.clientTs - b.clientTs);
      const completedAtMs =
        missedTeamIds.length === 0 && solvedEvents.length > 0
          ? solvedEvents[solvedEvents.length - 1].clientTs - params.startedAt
          : null;
      return {
        conference: conferenceId as ConferenceId,
        label: conference.label,
        solved: teams.length - missedTeamIds.length,
        total: teams.length,
        completed: missedTeamIds.length === 0,
        missedTeamIds,
        completedAtMs
      };
    })
    .sort(
      (a, b) =>
        params.dataset.conferences[a.conference].sortOrder -
        params.dataset.conferences[b.conference].sortOrder
    );

  const sortedEvents = [...params.answerEvents].sort((a, b) => a.clientTs - b.clientTs);
  const gaps = sortedEvents.slice(1).map((event, index) => event.clientTs - sortedEvents[index].clientTs);
  const elapsedMs = Math.max(1, params.finishedAt - params.startedAt);
  const finalMinuteFloor = params.finishedAt - 60_000;

  return {
    score: solved.size,
    total: params.dataset.teams.length,
    percentage: Math.round((solved.size / params.dataset.teams.length) * 1000) / 10,
    completed: solved.size === params.dataset.teams.length,
    conferencesCompleted: conferenceResults.filter((result) => result.completed).length,
    bestConference:
      [...conferenceResults].sort((a, b) => b.solved / b.total - a.solved / a.total)[0] ?? null,
    weakestConference:
      [...conferenceResults].sort((a, b) => a.solved / a.total - b.solved / b.total)[0] ?? null,
    conferenceResults,
    firstCorrectMs: sortedEvents[0] ? sortedEvents[0].clientTs - params.startedAt : null,
    lastCorrectMs: sortedEvents.at(-1) ? sortedEvents.at(-1)!.clientTs - params.startedAt : null,
    longestGapMs: gaps.length ? Math.max(...gaps) : null,
    finalMinuteScore: sortedEvents.filter((event) => event.clientTs >= finalMinuteFloor).length,
    answersPerMinute: Math.round((solved.size / (elapsedMs / 60_000)) * 10) / 10
  };
}

export function isLeaderboardEligible(params: {
  difficulty: DifficultyId;
  hintCount: number;
  resumed: boolean;
  serverIssued: boolean;
  status: "completed" | "expired" | "ended";
}): boolean {
  if (!params.serverIssued) return false;
  if (params.hintCount > 0) return false;
  if (params.difficulty === "easy") {
    return !params.resumed && params.status === "completed";
  }
  return params.status === "completed" || params.status === "expired";
}
