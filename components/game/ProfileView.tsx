"use client";

import { Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { fbsGameConfig } from "@/data/fbs/game-config";
import { validateCity, validateDisplayName } from "@/lib/quiz/profile";
import { historyStorageKey, loadJson, removeJson, saveJson, type StoredHistoryEntry } from "@/lib/quiz/storage";
import { formatElapsed } from "@/lib/quiz/timer";

type LocalProfile = {
  displayName: string;
  city: string;
  countryCode: string;
  showCity: boolean;
};

const profileKey = "sportsQuiz:v1:profile";

export function ProfileView() {
  const [profile, setProfile] = useState<LocalProfile>({
    displayName: "",
    city: "",
    countryCode: "US",
    showCity: true
  });
  const [history, setHistory] = useState<StoredHistoryEntry[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setProfile(
      loadJson<LocalProfile>(profileKey) ?? {
        displayName: "",
        city: "",
        countryCode: "US",
        showCity: true
      }
    );
    setHistory(loadJson<StoredHistoryEntry[]>(historyStorageKey(fbsGameConfig.id, fbsGameConfig.datasetVersion)) ?? []);
  }, []);

  const stats = useMemo(() => {
    const perfectScores = history.filter((entry) => entry.score === entry.total).length;
    const averageScore =
      history.length === 0
        ? 0
        : Math.round((history.reduce((sum, entry) => sum + entry.score, 0) / history.length) * 10) / 10;
    const bestByDifficulty = new Map<string, StoredHistoryEntry>();
    for (const entry of history) {
      const current = bestByDifficulty.get(entry.difficulty);
      if (!current || entry.score > current.score || (entry.score === current.score && entry.elapsedMs < current.elapsedMs)) {
        bestByDifficulty.set(entry.difficulty, entry);
      }
    }
    return { perfectScores, averageScore, bestByDifficulty };
  }, [history]);

  function saveProfile() {
    const nameError = validateDisplayName(profile.displayName);
    const cityError = validateCity(profile.city);
    if (nameError || cityError) {
      setMessage(nameError ?? cityError ?? "Check your profile.");
      return;
    }
    saveJson(profileKey, profile);
    setMessage("Profile saved on this device.");
  }

  function deleteProfile() {
    removeJson(profileKey);
    setProfile({ displayName: "", city: "", countryCode: "US", showCity: true });
    setMessage("Profile deleted from this device.");
  }

  function deleteHistory() {
    removeJson(historyStorageKey(fbsGameConfig.id, fbsGameConfig.datasetVersion));
    setHistory([]);
    setMessage("Game history deleted from this device.");
  }

  return (
    <section className="profile-panel">
      <p className="eyebrow">Profile</p>
      <h1 className="display-title">Your local locker.</h1>
      <p className="lead">
        You can play without registering. These profile fields are used only when you choose to submit
        a leaderboard result.
      </p>

      <section className="mt-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <label className="grid gap-1">
            <span className="text-sm font-bold">Display name</span>
            <input className="answer-input !min-h-11 !text-base" value={profile.displayName} maxLength={32} onChange={(event) => setProfile({ ...profile, displayName: event.target.value })} />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-bold">City</span>
            <input className="answer-input !min-h-11 !text-base" value={profile.city} maxLength={40} onChange={(event) => setProfile({ ...profile, city: event.target.value })} />
          </label>
          <label className="grid gap-1">
            <span className="text-sm font-bold">Country</span>
            <select className="answer-input !min-h-11 !text-base" value={profile.countryCode} onChange={(event) => setProfile({ ...profile, countryCode: event.target.value })}>
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
              <option value="CA">Canada</option>
              <option value="AU">Australia</option>
              <option value="IE">Ireland</option>
            </select>
          </label>
          <label className="flex min-h-11 items-center gap-2 pt-6">
            <input type="checkbox" checked={profile.showCity} onChange={(event) => setProfile({ ...profile, showCity: event.target.checked })} />
            <span>Show city</span>
          </label>
        </div>
        <p className="mt-3 text-sm text-[var(--color-muted)]">
          Your display name, city and country may appear publicly on leaderboards.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className="button primary" type="button" onClick={saveProfile}>Save Profile</button>
          <button className="button" type="button" onClick={deleteProfile}>
            <Trash2 size={17} aria-hidden="true" />
            Delete Profile
          </button>
        </div>
        {message ? <p className="mt-3 text-sm text-[var(--color-muted)]">{message}</p> : null}
      </section>

      <section className="mt-6 grid gap-3 md:grid-cols-4">
        <Metric label="Attempts" value={`${history.length}`} />
        <Metric label="Average score" value={`${stats.averageScore}`} />
        <Metric label="Perfect scores" value={`${stats.perfectScores}`} />
        <Metric label="Recent streak" value={`${history.filter((entry) => entry.completed).length}`} />
      </section>

      <section className="mt-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black uppercase">Recent attempts</h2>
          <button className="button ghost" type="button" onClick={deleteHistory}>
            <Trash2 size={17} aria-hidden="true" />
            Delete history
          </button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.08em] text-[var(--color-muted)]">
                <th className="p-2">Date</th>
                <th className="p-2">Difficulty</th>
                <th className="p-2">Score</th>
                <th className="p-2">Time</th>
                <th className="p-2">Status</th>
                <th className="p-2">Eligible</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <tr key={entry.id} className="border-t border-[var(--color-border)]">
                  <td className="p-2">{new Date(entry.createdAt).toLocaleDateString()}</td>
                  <td className="p-2 capitalize">{entry.difficulty}</td>
                  <td className="p-2 metric">{entry.score} / {entry.total}</td>
                  <td className="p-2">{formatElapsed(entry.elapsedMs)}</td>
                  <td className="p-2">{entry.completed ? "Completed" : "Incomplete"}</td>
                  <td className="p-2">{entry.eligible ? "Yes" : "No"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="score-tile">
      <span>{label}</span>
      <strong className="metric text-3xl">{value}</strong>
    </div>
  );
}
