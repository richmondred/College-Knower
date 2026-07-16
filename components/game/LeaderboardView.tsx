"use client";

import { RefreshCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { fbsGameConfig } from "@/data/fbs/game-config";
import type { DifficultyId } from "@/data/fbs/types";
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
  difficulty: DifficultyId;
  display_name?: string;
  displayName?: string;
  city: string | null;
  show_city?: boolean;
  showCity?: boolean;
  country_code?: string;
  countryCode?: string;
  score: number;
  total: number;
  completion_ms?: number | null;
  completionMs?: number | null;
  completed: boolean;
  verified: boolean;
  moderation_state?: "visible" | "hidden" | "flagged";
  moderationState?: "visible" | "hidden" | "flagged";
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
};

type LeaderboardMode = DifficultyId | "overall";

const difficultyLabels: Record<DifficultyId, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard"
};

function normaliseEntry(entry: ApiEntry): LeaderboardEntry {
  return {
    id: entry.id,
    attemptId: entry.attemptId ?? entry.attempt_id ?? entry.id,
    profileId: entry.profileId ?? entry.profile_id ?? entry.id,
    quizId: entry.quizId ?? entry.quiz_id ?? fbsGameConfig.id,
    datasetVersion: entry.datasetVersion ?? entry.dataset_version ?? fbsGameConfig.datasetVersion,
    difficulty: entry.difficulty,
    displayName: entry.displayName ?? entry.display_name ?? "Player",
    city: entry.city,
    showCity: entry.showCity ?? entry.show_city ?? true,
    countryCode: entry.countryCode ?? entry.country_code ?? "US",
    score: entry.score,
    total: entry.total,
    completionMs: entry.completionMs ?? entry.completion_ms ?? null,
    completed: entry.completed,
    verified: entry.verified,
    moderationState: entry.moderationState ?? entry.moderation_state ?? "visible",
    createdAt: entry.createdAt ?? entry.created_at ?? new Date().toISOString(),
    updatedAt: entry.updatedAt ?? entry.updated_at ?? new Date().toISOString()
  };
}

export function LeaderboardView() {
  const [leaderboardMode, setLeaderboardMode] = useState<LeaderboardMode>("overall");
  const [scope, setScope] = useState("global");
  const [country, setCountry] = useState("US");
  const [city, setCity] = useState("");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [message, setMessage] = useState("Loading leaderboard...");

  async function loadLeaderboard() {
    const params = new URLSearchParams({ difficulty: leaderboardMode, scope });
    if (scope === "country") params.set("country", country);
    if (scope === "city") params.set("city", city);
    try {
      const response = await fetch(`/api/leaderboard?${params.toString()}`);
      const payload = (await response.json()) as {
        publicLeaderboardAvailable: boolean;
        entries: ApiEntry[];
      };
      if (payload.publicLeaderboardAvailable) {
        setEntries(payload.entries.map(normaliseEntry));
        setMessage(payload.entries.length ? "" : "No verified entries yet.");
        return;
      }
    } catch {
      // Local fallback below.
    }
    const localEntries =
      leaderboardMode === "overall"
        ? fbsGameConfig.difficulties.flatMap((item) => {
            const key = leaderboardStorageKey(fbsGameConfig.id, fbsGameConfig.datasetVersion, item.id);
            return loadJson<LeaderboardEntry[]>(key) ?? [];
          })
        : loadJson<LeaderboardEntry[]>(
            leaderboardStorageKey(fbsGameConfig.id, fbsGameConfig.datasetVersion, leaderboardMode)
          ) ?? [];
    setEntries(bestPublicEntries(localEntries));
    setMessage(
      localEntries.length
        ? "Public leaderboard is unavailable. Showing entries saved on this device."
        : "Public leaderboard is unavailable until Supabase is configured."
    );
  }

  useEffect(() => {
    loadLeaderboard();
    const interval = window.setInterval(loadLeaderboard, 15_000);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaderboardMode, scope, country, city]);

  const ranked = useMemo(() => [...entries].sort(compareLeaderboardEntries), [entries]);

  return (
    <section className="leaderboard-panel">
      <p className="eyebrow">Leaderboard</p>
      <h1 className="display-title">All teams rankings.</h1>
      <div className="mb-5 grid gap-3 md:grid-cols-5">
        <label className="grid gap-1">
          <span className="text-sm font-bold">Leaderboard</span>
          <select
            className="answer-input !min-h-11 !text-base"
            value={leaderboardMode}
            onChange={(event) => setLeaderboardMode(event.target.value as LeaderboardMode)}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="overall">Overall</option>
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-sm font-bold">View</span>
          <select className="answer-input !min-h-11 !text-base" value={scope} onChange={(event) => setScope(event.target.value)}>
            <option value="global">Global</option>
            <option value="country">Country</option>
            <option value="city">City</option>
            <option value="week">This week</option>
            <option value="all">All time</option>
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-sm font-bold">Country</span>
          <select className="answer-input !min-h-11 !text-base" value={country} onChange={(event) => setCountry(event.target.value)}>
            <option value="US">United States</option>
            <option value="GB">United Kingdom</option>
            <option value="CA">Canada</option>
            <option value="AU">Australia</option>
          </select>
        </label>
        <label className="grid gap-1">
          <span className="text-sm font-bold">City</span>
          <input className="answer-input !min-h-11 !text-base" value={city} onChange={(event) => setCity(event.target.value)} />
        </label>
        <button className="button mt-6" type="button" onClick={loadLeaderboard}>
          <RefreshCcw size={17} aria-hidden="true" />
          Refresh
        </button>
      </div>

      {message ? <p className="mb-4 text-[var(--color-muted)]">{message}</p> : null}

      <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
        <table className="w-full min-w-[780px] border-collapse bg-[var(--color-surface)]">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.08em] text-[var(--color-muted)]">
              <th className="p-3">Rank</th>
              <th className="p-3">Display name</th>
              <th className="p-3">Difficulty</th>
              <th className="p-3">Location</th>
              <th className="p-3">Score</th>
              <th className="p-3">Time</th>
              <th className="p-3">Date</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((entry, index) => (
              <tr key={entry.id} className="border-t border-[var(--color-border)]">
                <td className="p-3 metric">{index + 1}</td>
                <td className="p-3 font-bold">{entry.displayName}</td>
                <td className="p-3">{difficultyLabels[entry.difficulty]}</td>
                <td className="p-3 text-[var(--color-muted)]">
                  {countryFlag(entry.countryCode)} {entry.showCity && entry.city ? `${entry.city}, ` : ""}
                  {entry.countryCode}
                </td>
                <td className="p-3 metric">{entry.score} / {entry.total}</td>
                <td className="p-3">{entry.completionMs === null ? "No time" : formatElapsed(entry.completionMs)}</td>
                <td className="p-3">{new Date(entry.createdAt).toLocaleDateString()}</td>
                <td className="p-3">{entry.completed ? "Completed" : "Incomplete"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
