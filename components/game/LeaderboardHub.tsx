"use client";

import { ArrowRight, RefreshCcw, Trophy } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { quizThemeStyle } from "@/data/knowledge/themes";
import type { LeaderboardQuizOption } from "@/data/leaderboard-options";
import {
  bestPublicEntries,
  compareLeaderboardEntries,
  countryFlag,
  type LeaderboardEntry
} from "@/lib/quiz/leaderboard";
import { leaderboardStorageKey, loadJson } from "@/lib/quiz/storage";
import { formatElapsed } from "@/lib/quiz/timer";

type ApiEntry = {
  id: string;
  attempt_id?: string;
  attemptId?: string;
  profile_id?: string;
  profileId?: string;
  quiz_id?: string;
  quizId?: string;
  dataset_version?: string;
  datasetVersion?: string;
  difficulty?: string;
  display_name?: string;
  displayName?: string;
  city?: string | null;
  show_city?: boolean;
  showCity?: boolean;
  country_code?: string;
  countryCode?: string;
  score?: number;
  total?: number;
  completion_ms?: number | null;
  completionMs?: number | null;
  completed?: boolean;
  verified?: boolean;
  moderation_state?: "visible" | "hidden" | "flagged";
  moderationState?: "visible" | "hidden" | "flagged";
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
};

type LeaderboardHubProps = {
  options: LeaderboardQuizOption[];
  initialQuizId?: string;
  initialModeId?: string;
};

function normaliseEntry(entry: ApiEntry, selectedQuiz: LeaderboardQuizOption): LeaderboardEntry {
  const now = new Date().toISOString();
  return {
    id: entry.id,
    attemptId: entry.attemptId ?? entry.attempt_id ?? entry.id,
    profileId: entry.profileId ?? entry.profile_id ?? entry.id,
    quizId: entry.quizId ?? entry.quiz_id ?? selectedQuiz.id,
    datasetVersion: entry.datasetVersion ?? entry.dataset_version ?? selectedQuiz.datasetVersion,
    difficulty: entry.difficulty ?? selectedQuiz.modes[0]?.id ?? "overall",
    displayName: entry.displayName ?? entry.display_name ?? "Player",
    city: entry.city ?? null,
    showCity: entry.showCity ?? entry.show_city ?? true,
    countryCode: entry.countryCode ?? entry.country_code ?? "US",
    score: entry.score ?? 0,
    total: entry.total ?? 0,
    completionMs: entry.completionMs ?? entry.completion_ms ?? null,
    completed: entry.completed ?? false,
    verified: entry.verified ?? true,
    moderationState: entry.moderationState ?? entry.moderation_state ?? "visible",
    createdAt: entry.createdAt ?? entry.created_at ?? now,
    updatedAt: entry.updatedAt ?? entry.updated_at ?? now
  };
}

function modeLabel(selectedQuiz: LeaderboardQuizOption, modeId: string) {
  return selectedQuiz.modes.find((mode) => mode.id === modeId)?.label ?? modeId;
}

function localEntriesForMode(selectedQuiz: LeaderboardQuizOption, modeId: string) {
  const modes =
    modeId === "overall"
      ? selectedQuiz.modes
      : selectedQuiz.modes.filter((mode) => mode.id === modeId);

  return modes.flatMap((mode) => {
    const storageKey = leaderboardStorageKey(
      selectedQuiz.id,
      selectedQuiz.datasetVersion,
      mode.id
    );
    return loadJson<LeaderboardEntry[]>(storageKey) ?? [];
  });
}

function filterLocalEntries(
  entries: LeaderboardEntry[],
  scope: string,
  country: string,
  city: string
) {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const cityFilter = city.trim().toLowerCase();

  return entries.filter((entry) => {
    if (scope === "country" && entry.countryCode !== country) return false;
    if (
      scope === "city" &&
      cityFilter &&
      (entry.city ?? "").trim().toLowerCase() !== cityFilter
    ) {
      return false;
    }
    if (scope === "week" && new Date(entry.createdAt).getTime() < weekAgo) return false;
    return true;
  });
}

export function LeaderboardHub({
  options,
  initialQuizId,
  initialModeId = "overall"
}: LeaderboardHubProps) {
  const firstQuiz = options[0];
  const initialQuiz = options.find((option) => option.id === initialQuizId) ?? firstQuiz;
  const [selectedQuizId, setSelectedQuizId] = useState(initialQuiz?.id ?? "");
  const selectedQuiz =
    options.find((option) => option.id === selectedQuizId) ?? initialQuiz ?? firstQuiz;
  const hasInitialMode =
    initialModeId === "overall" ||
    Boolean(selectedQuiz?.modes.some((mode) => mode.id === initialModeId));
  const [selectedMode, setSelectedMode] = useState(hasInitialMode ? initialModeId : "overall");
  const [scope, setScope] = useState("global");
  const [country, setCountry] = useState("US");
  const [city, setCity] = useState("");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [message, setMessage] = useState("Loading leaderboard...");

  useEffect(() => {
    if (!selectedQuiz) return;
    const validMode =
      selectedMode === "overall" ||
      selectedQuiz.modes.some((mode) => mode.id === selectedMode);
    if (!validMode) setSelectedMode("overall");
  }, [selectedMode, selectedQuiz]);

  const loadLeaderboard = useCallback(async () => {
    if (!selectedQuiz) return;
    const params = new URLSearchParams({
      quizId: selectedQuiz.id,
      datasetVersion: selectedQuiz.datasetVersion,
      difficulty: selectedMode,
      scope
    });
    if (scope === "country") params.set("country", country);
    if (scope === "city") params.set("city", city);

    try {
      const response = await fetch(`/api/leaderboard?${params.toString()}`);
      const payload = (await response.json()) as {
        publicLeaderboardAvailable: boolean;
        entries: ApiEntry[];
      };
      if (payload.publicLeaderboardAvailable) {
        setEntries(payload.entries.map((entry) => normaliseEntry(entry, selectedQuiz)));
        setMessage(payload.entries.length ? "" : "No public entries yet.");
        return;
      }
    } catch {
      // Local fallback below.
    }

    const localEntries = filterLocalEntries(
      localEntriesForMode(selectedQuiz, selectedMode),
      scope,
      country,
      city
    );
    setEntries(bestPublicEntries(localEntries));
    setMessage(
      localEntries.length
        ? "Showing entries saved on this device."
        : "No saved entries yet. Finish a quiz and save your result."
    );
  }, [city, country, scope, selectedMode, selectedQuiz]);

  useEffect(() => {
    loadLeaderboard();
    const interval = window.setInterval(loadLeaderboard, 15_000);
    return () => window.clearInterval(interval);
  }, [loadLeaderboard]);

  const ranked = useMemo(() => [...entries].sort(compareLeaderboardEntries), [entries]);
  const themeStyle = selectedQuiz ? quizThemeStyle(selectedQuiz.theme) : undefined;

  if (!selectedQuiz) return null;

  return (
    <main className="game-shell knowledge-shell leaderboard-shell" style={themeStyle}>
      <section className="leaderboard-panel leaderboard-hub">
        <div className="leaderboard-hero">
          <div>
            <p className="eyebrow">Leaderboard</p>
            <h1 className="display-title">ball knowers rankings.</h1>
            <p className="lead">
              Pick a game, pick a mode, then filter the board by global, country,
              city, week or all-time views.
            </p>
          </div>
          <Link className="button primary" href={selectedQuiz.href}>
            <Trophy size={18} aria-hidden="true" />
            Play Selected Quiz
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>

        <div className="leaderboard-controls">
          <label className="grid gap-1">
            <span className="text-sm font-bold">Game</span>
            <select
              className="answer-input !min-h-11 !text-base"
              value={selectedQuiz.id}
              onChange={(event) => {
                setSelectedQuizId(event.target.value);
                setSelectedMode("overall");
              }}
            >
              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.shortLabel}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-bold">Mode</span>
            <select
              className="answer-input !min-h-11 !text-base"
              value={selectedMode}
              onChange={(event) => setSelectedMode(event.target.value)}
            >
              <option value="overall">Overall</option>
              {selectedQuiz.modes.map((mode) => (
                <option key={mode.id} value={mode.id}>
                  {mode.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-bold">View</span>
            <select
              className="answer-input !min-h-11 !text-base"
              value={scope}
              onChange={(event) => setScope(event.target.value)}
            >
              <option value="global">Global</option>
              <option value="country">Country</option>
              <option value="city">City</option>
              <option value="week">This week</option>
              <option value="all">All time</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-bold">Country</span>
            <select
              className="answer-input !min-h-11 !text-base"
              value={country}
              onChange={(event) => setCountry(event.target.value)}
            >
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
              <option value="CA">Canada</option>
              <option value="AU">Australia</option>
              <option value="IE">Ireland</option>
              <option value="NZ">New Zealand</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-bold">City</span>
            <input
              className="answer-input !min-h-11 !text-base"
              value={city}
              onChange={(event) => setCity(event.target.value)}
            />
          </label>
          <button className="button leaderboard-refresh" type="button" onClick={loadLeaderboard}>
            <RefreshCcw size={17} aria-hidden="true" />
            Refresh
          </button>
        </div>

        <div className="leaderboard-context">
          <span>{selectedQuiz.category}</span>
          <strong>{selectedQuiz.label}</strong>
          <span>{selectedMode === "overall" ? "Overall" : modeLabel(selectedQuiz, selectedMode)}</span>
        </div>

        {message ? <p className="mb-4 text-[var(--color-muted)]">{message}</p> : null}

        <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
          <table className="w-full min-w-[860px] border-collapse bg-[var(--color-surface)]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.08em] text-[var(--color-muted)]">
                <th className="p-3">Rank</th>
                <th className="p-3">Display name</th>
                <th className="p-3">Game</th>
                <th className="p-3">Mode</th>
                <th className="p-3">Location</th>
                <th className="p-3">Score</th>
                <th className="p-3">Time</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {ranked.length ? (
                ranked.map((entry, index) => (
                  <tr key={entry.id} className="border-t border-[var(--color-border)]">
                    <td className="p-3 metric">{index + 1}</td>
                    <td className="p-3 font-bold">{entry.displayName}</td>
                    <td className="p-3 text-[var(--color-muted)]">{selectedQuiz.shortLabel}</td>
                    <td className="p-3">{modeLabel(selectedQuiz, entry.difficulty)}</td>
                    <td className="p-3 text-[var(--color-muted)]">
                      {countryFlag(entry.countryCode)}{" "}
                      {entry.showCity && entry.city ? `${entry.city}, ` : ""}
                      {entry.countryCode}
                    </td>
                    <td className="p-3 metric">{entry.score} / {entry.total}</td>
                    <td className="p-3">
                      {entry.completionMs === null ? "No time" : formatElapsed(entry.completionMs)}
                    </td>
                    <td className="p-3">{new Date(entry.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr className="border-t border-[var(--color-border)]">
                  <td className="p-5 text-[var(--color-muted)]" colSpan={8}>
                    No leaderboard entries match these filters yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
