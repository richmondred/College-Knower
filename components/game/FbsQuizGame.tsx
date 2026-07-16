"use client";

import { CheckCircle, Clipboard, Flag, Home, Lightbulb, Play, RotateCcw, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { fbs2026Dataset } from "@/data/fbs/fbs-2026.1";
import { fbsGameConfig } from "@/data/fbs/game-config";
import type { ConferenceId, DifficultyId } from "@/data/fbs/types";
import { compareLeaderboardEntries, type LeaderboardEntry } from "@/lib/quiz/leaderboard";
import { difficultyById, findTeam, resolveAnswer } from "@/lib/quiz/matcher";
import { validateCity, validateDisplayName } from "@/lib/quiz/profile";
import { isLeaderboardEligible, summariseAttempt, type AttemptSummary } from "@/lib/quiz/results";
import {
  appendHistory,
  attemptStorageKey,
  historyStorageKey,
  leaderboardStorageKey,
  loadAttempt,
  loadJson,
  removeJson,
  saveJson,
  saveLocalLeaderboard,
  type StoredHistoryEntry
} from "@/lib/quiz/storage";
import {
  computeElapsedMs,
  computeRemainingMs,
  createLocalAttempt,
  formatClock,
  formatElapsed,
  isExpired,
  type ActiveAttemptState
} from "@/lib/quiz/timer";
import { ConferenceGrid } from "./ConferenceGrid";

type Phase = "intro" | "active" | "results";
type FinishStatus = "completed" | "expired" | "ended";

const dataset = fbs2026Dataset;
const gameConfig = fbsGameConfig;

function nowIso(): string {
  return new Date().toISOString();
}

function randomId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function FbsQuizGame() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [difficultyId, setDifficultyId] = useState<DifficultyId>("medium");
  const difficulty = useMemo(
    () => difficultyById(gameConfig.difficulties, difficultyId),
    [difficultyId]
  );
  const [attempt, setAttempt] = useState<ActiveAttemptState | null>(null);
  const [savedAttempt, setSavedAttempt] = useState<ActiveAttemptState | null>(null);
  const [serverBacked, setServerBacked] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [feedback, setFeedback] = useState("");
  const [lastAccepted, setLastAccepted] = useState("");
  const [liveMessage, setLiveMessage] = useState("");
  const [assertiveMessage, setAssertiveMessage] = useState("");
  const [recentTeamIds, setRecentTeamIds] = useState<Set<string>>(new Set());
  const [expandedConference, setExpandedConference] = useState<ConferenceId | null>("acc");
  const [now, setNow] = useState(() => Date.now());
  const [finishStatus, setFinishStatus] = useState<FinishStatus>("ended");
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileCity, setProfileCity] = useState("");
  const [profileCountry, setProfileCountry] = useState("US");
  const [showCity, setShowCity] = useState(true);
  const [submissionMessage, setSubmissionMessage] = useState("");
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [submittingResult, setSubmittingResult] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [history, setHistory] = useState<StoredHistoryEntry[]>([]);
  const [correctFlash, setCorrectFlash] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const flashTimerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const composingRef = useRef(false);
  const finishedRef = useRef(false);

  const activeStorageKey = attemptStorageKey(gameConfig.id, gameConfig.datasetVersion, difficultyId);
  const localHistoryKey = historyStorageKey(gameConfig.id, gameConfig.datasetVersion);

  const solvedTeamIds = useMemo(
    () => new Set(attempt?.solvedTeamIds ?? []),
    [attempt?.solvedTeamIds]
  );
  const hintedTeamIds = useMemo(
    () => new Set(attempt?.hintTeamIds ?? []),
    [attempt?.hintTeamIds]
  );
  const unhintedRemainingCount = useMemo(
    () =>
      dataset.teams.filter((team) => !solvedTeamIds.has(team.id) && !hintedTeamIds.has(team.id))
        .length,
    [hintedTeamIds, solvedTeamIds]
  );

  const remainingMs = computeRemainingMs(attempt?.deadlineAt ?? null, now);
  const elapsedMs = attempt ? computeElapsedMs(attempt.startedAt, finishedAt ?? now) : 0;
  const cluesRemaining = attempt
    ? Math.max(0, difficulty.clueLimit - attempt.hintCount)
    : difficulty.clueLimit;
  const canRevealHint =
    Boolean(attempt) &&
    difficulty.hintsAllowed &&
    cluesRemaining > 0 &&
    unhintedRemainingCount > 0;
  const summary: AttemptSummary | null = useMemo(() => {
    if (!attempt || phase !== "results" || finishedAt === null) return null;
    return summariseAttempt({
      dataset,
      solvedTeamIds: attempt.solvedTeamIds,
      answerEvents: attempt.answerEvents,
      startedAt: attempt.startedAt,
      finishedAt
    });
  }, [attempt, phase, finishedAt]);

  useEffect(() => {
    setSavedAttempt(loadAttempt(activeStorageKey));
    setHistory(loadJson<StoredHistoryEntry[]>(localHistoryKey) ?? []);
  }, [activeStorageKey, localHistoryKey]);

  useEffect(() => {
    if (!attempt || phase !== "active") return;
    saveJson(activeStorageKey, attempt);
  }, [activeStorageKey, attempt, phase]);

  useEffect(() => {
    if (phase !== "active") return;
    inputRef.current?.focus({ preventScroll: true });
  }, [phase]);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current !== null) {
        window.clearTimeout(flashTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (phase !== "active" || !attempt) return;
    const tick = () => {
      const nextNow = Date.now();
      setNow(nextNow);
      const remaining = computeRemainingMs(attempt.deadlineAt, nextNow);
      if (remaining !== null && remaining <= 30_000 && remaining > 29_000) {
        setAssertiveMessage("30 seconds remaining.");
      }
      if (remaining !== null && remaining <= 10_000 && remaining > 9_000) {
        setAssertiveMessage("10 seconds remaining.");
      }
      if (isExpired(attempt.deadlineAt, nextNow)) {
        finishAttempt("expired", attempt, nextNow);
      }
    };
    const interval = window.setInterval(tick, 500);
    const onVisibility = () => tick();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);
    window.addEventListener("online", onVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
      window.removeEventListener("online", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, phase]);

  function playCorrectDing() {
    try {
      const AudioContextCtor =
        window.AudioContext ??
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) return;
      const context = audioContextRef.current ?? new AudioContextCtor();
      audioContextRef.current = context;
      void context.resume();

      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(740, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(1040, context.currentTime + 0.09);
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.045, context.currentTime + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.16);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.17);
    } catch {
      // Audio feedback is an enhancement; the green flash remains the fallback.
    }
  }

  function triggerCorrectFeedback() {
    playCorrectDing();
    setCorrectFlash(true);
    if (flashTimerRef.current !== null) {
      window.clearTimeout(flashTimerRef.current);
    }
    flashTimerRef.current = window.setTimeout(() => setCorrectFlash(false), 700);
  }

  async function startGame(resume = false) {
    finishedRef.current = false;
    setFinishedAt(null);
    setFinishStatus("ended");
    setSubmissionMessage("");
    setSubmissionComplete(false);
    setSubmittingResult(false);
    setShareMessage("");
    setFeedback("");
    setLastAccepted("");
    setRecentTeamIds(new Set());

    if (resume && savedAttempt) {
      const resumed = {
        ...savedAttempt,
        hintTeamIds: savedAttempt.hintTeamIds ?? [],
        resumed: savedAttempt.resumed || difficulty.id === "easy",
        lastUpdatedAt: Date.now()
      };
      setAttempt(resumed);
      setPhase("active");
      setServerBacked(false);
      setInputValue("");
      return;
    }

    const localAttempt = createLocalAttempt(difficulty, gameConfig.id, gameConfig.datasetVersion);
    try {
      const response = await fetch("/api/attempts/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          quizId: gameConfig.id,
          datasetVersion: gameConfig.datasetVersion,
          difficulty: difficulty.id
        })
      });
      if (response.ok) {
        const payload = (await response.json()) as {
          serverBacked: boolean;
          attempt?: Partial<ActiveAttemptState>;
        };
        setServerBacked(payload.serverBacked);
        setAttempt({ ...localAttempt, ...payload.attempt });
      } else {
        setServerBacked(false);
        setAttempt(localAttempt);
      }
    } catch {
      setServerBacked(false);
      setAttempt(localAttempt);
    }
    setPhase("active");
    setInputValue("");
  }

  function applyAcceptedTeamIds(teamIds: string[]) {
    if (!attempt || teamIds.length === 0) return;
    const currentSolved = new Set(attempt.solvedTeamIds);
    const newIds = teamIds.filter((id) => !currentSolved.has(id));
    if (newIds.length === 0) return;
    const acceptedNames = newIds.map((id) => findTeam(dataset, id).displaySchool);
    let nextAttempt: ActiveAttemptState | null = null;
    const acceptedAt = Date.now();

    setAttempt((previous) => {
      if (!previous) return previous;
      const solved = new Set(previous.solvedTeamIds);
      const freshIds = newIds.filter((id) => !solved.has(id));
      if (freshIds.length === 0) return previous;
      for (const id of freshIds) solved.add(id);
      const events = freshIds.map((teamId, index) => ({
        teamId,
        clientTs: acceptedAt,
        sequence: previous.answerEvents.length + index + 1,
        difficulty: previous.difficulty,
        attemptId: previous.attemptId
      }));
      nextAttempt = {
        ...previous,
        solvedTeamIds: [...previous.solvedTeamIds, ...freshIds],
        answerEvents: [...previous.answerEvents, ...events],
        lastUpdatedAt: acceptedAt
      };
      return nextAttempt;
    });

    if (acceptedNames.length) {
      triggerCorrectFeedback();
      setRecentTeamIds(new Set(newIds));
      window.setTimeout(() => setRecentTeamIds(new Set()), 850);
      const firstTeam = findTeam(dataset, newIds[0]);
      setExpandedConference(firstTeam.conference);
      const message = acceptedNames.join(", ");
      setLastAccepted(message);
      setLiveMessage(`${message} accepted. ${attempt.solvedTeamIds.length + newIds.length} of ${dataset.teams.length}.`);
      setFeedback(newIds.length > 1 ? "Cascading answer recognition registered multiple teams." : "Accepted.");
    }

    window.setTimeout(() => {
      if (nextAttempt && nextAttempt.solvedTeamIds.length === dataset.teams.length) {
        finishAttempt("completed", nextAttempt, acceptedAt);
      }
    }, 0);
  }

  function evaluateAnswer(raw: string, submitted = false) {
    if (!attempt || composingRef.current) return;
    setCorrectFlash(false);
    const result = resolveAnswer(raw, {
      dataset,
      difficulty,
      solvedTeamIds,
      submitted
    });
    setFeedback(result.feedback);

    if (result.acceptedTeamIds.length > 0) {
      flushSync(() => setInputValue(""));
      applyAcceptedTeamIds(result.acceptedTeamIds);
      return;
    }

    if (difficulty.id === "hard" && submitted && raw.trim()) {
      setAssertiveMessage("No exact Hard-mode answer found.");
    }
  }

  function handleInputChange(value: string, isComposing: boolean) {
    setInputValue(value);
    if (!difficulty.autoSubmit || isComposing || composingRef.current) return;
    evaluateAnswer(value, false);
  }

  function revealHint() {
    if (!attempt || !difficulty.hintsAllowed) return;
    if (attempt.hintCount >= difficulty.clueLimit) {
      setFeedback("No clues remaining.");
      return;
    }
    const remaining = dataset.teams
      .filter((team) => !solvedTeamIds.has(team.id) && !hintedTeamIds.has(team.id))
      .sort((a, b) => a.school.localeCompare(b.school));
    const clueTeam = remaining[0];
    if (!clueTeam) {
      setFeedback("No clue slots remaining.");
      return;
    }
    const hintedAt = Date.now();
    setAttempt((previous) => {
      if (!previous) return previous;
      if (previous.solvedTeamIds.includes(clueTeam.id)) return previous;
      const previousHints = previous.hintTeamIds ?? [];
      if (previousHints.includes(clueTeam.id)) return previous;
      return {
        ...previous,
        hintTeamIds: [...previousHints, clueTeam.id],
        hintCount: previous.hintCount + 1,
        lastUpdatedAt: hintedAt
      };
    });
    setRecentTeamIds(new Set([clueTeam.id]));
    window.setTimeout(() => setRecentTeamIds(new Set()), 850);
    setExpandedConference(clueTeam.conference);
    setFeedback(`Clue revealed: ${clueTeam.nickname}.`);
    setLiveMessage(`${clueTeam.nickname} clue revealed. ${cluesRemaining - 1} clues remaining.`);
  }

  function finishAttempt(status: FinishStatus, finalAttempt = attempt, at = Date.now()) {
    if (!finalAttempt || finishedRef.current) return;
    finishedRef.current = true;
    setAttempt(finalAttempt);
    setFinishStatus(status);
    setFinishedAt(at);
    setPhase("results");
    removeJson(activeStorageKey);
    const attemptSummary = summariseAttempt({
      dataset,
      solvedTeamIds: finalAttempt.solvedTeamIds,
      answerEvents: finalAttempt.answerEvents,
      startedAt: finalAttempt.startedAt,
      finishedAt: at
    });
    const eligible = isLeaderboardEligible({
      difficulty: finalAttempt.difficulty,
      hintCount: finalAttempt.hintCount,
      resumed: finalAttempt.resumed,
      serverIssued: serverBacked,
      status
    });
    const historyEntry: StoredHistoryEntry = {
      id: randomId("history"),
      quizId: gameConfig.id,
      datasetVersion: gameConfig.datasetVersion,
      difficulty: finalAttempt.difficulty,
      score: attemptSummary.score,
      total: attemptSummary.total,
      percentage: attemptSummary.percentage,
      elapsedMs: at - finalAttempt.startedAt,
      completed: status === "completed",
      conferencesCompleted: attemptSummary.conferencesCompleted,
      hintCount: finalAttempt.hintCount,
      resumed: finalAttempt.resumed,
      eligible,
      createdAt: nowIso()
    };
    appendHistory(localHistoryKey, historyEntry);
    setHistory(loadJson<StoredHistoryEntry[]>(localHistoryKey) ?? [historyEntry]);
    setAssertiveMessage(status === "expired" ? "Time expired." : "");
  }

  async function submitProfile() {
    if (!attempt || !summary || finishedAt === null) return;
    if (submittingResult || submissionComplete) return;
    const nameError = validateDisplayName(profileName);
    const cityError = validateCity(profileCity);
    if (nameError || cityError) {
      setSubmissionMessage(nameError ?? cityError ?? "Check your profile details.");
      return;
    }
    setSubmittingResult(true);

    const entry: LeaderboardEntry = {
      id: randomId("entry"),
      attemptId: attempt.attemptId,
      profileId: randomId("profile"),
      quizId: gameConfig.id,
      datasetVersion: gameConfig.datasetVersion,
      difficulty: attempt.difficulty,
      displayName: profileName.trim(),
      city: profileCity.trim() || null,
      showCity,
      countryCode: profileCountry,
      score: summary.score,
      total: summary.total,
      completionMs: summary.completed ? finishedAt - attempt.startedAt : elapsedMs,
      completed: summary.completed,
      verified: serverBacked,
      moderationState: "visible",
      createdAt: nowIso(),
      updatedAt: nowIso()
    };

    try {
      const response = await fetch("/api/attempts/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          profile: {
            displayName: entry.displayName,
            city: entry.city,
            countryCode: entry.countryCode,
            showCity
          },
          attempt: {
            id: attempt.attemptId,
            quizId: attempt.quizId,
            datasetVersion: attempt.datasetVersion,
            difficulty: attempt.difficulty,
            solvedTeamIds: attempt.solvedTeamIds,
            hintCount: attempt.hintCount,
            resumed: attempt.resumed,
            answerEvents: attempt.answerEvents,
            finishedAt
          }
        })
      });
      const payload = (await response.json()) as { message?: string; publicLeaderboardAvailable?: boolean };
      if (response.ok && payload.publicLeaderboardAvailable) {
        setSubmissionMessage(payload.message ?? "Result submitted.");
        setSubmissionComplete(true);
        setSubmittingResult(false);
        return;
      }
    } catch {
      // Local fallback below.
    }

    const storageKey = leaderboardStorageKey(gameConfig.id, gameConfig.datasetVersion, attempt.difficulty);
    const entries = saveLocalLeaderboard(storageKey, { ...entry, verified: true });
    const rank = [...entries].sort(compareLeaderboardEntries).findIndex((candidate) => candidate.id === entry.id) + 1;
    setSubmissionMessage(
      `Saved on this device. Public leaderboard is unavailable until Supabase is configured. Local rank: ${rank}.`
    );
    setSubmissionComplete(true);
    setSubmittingResult(false);
  }

  async function shareResult() {
    if (!summary || !attempt) return;
    const text = buildShareText(summary, attempt.difficulty, elapsedMs);
    try {
      if (navigator.share) {
        await navigator.share({ text });
        setShareMessage("Shared.");
      } else {
        await navigator.clipboard.writeText(text);
        setShareMessage("Copied.");
      }
    } catch {
      setShareMessage("Share cancelled.");
    }
  }

  const personalBestByDifficulty = useMemo(() => {
    const map = new Map<DifficultyId, StoredHistoryEntry>();
    for (const entry of history) {
      const current = map.get(entry.difficulty);
      if (!current) {
        map.set(entry.difficulty, entry);
        continue;
      }
      if (
        entry.score > current.score ||
        (entry.score === current.score && entry.elapsedMs < current.elapsedMs)
      ) {
        map.set(entry.difficulty, entry);
      }
    }
    return map;
  }, [history]);

  if (phase === "intro") {
    return (
      <main className="game-shell">
        <section className="pregame-panel">
          <p className="eyebrow">2026 FBS alignment</p>
          <h1 className="display-title">Name Every Current FBS College Football Team</h1>
          <p className="lead">
            Type school names against a clean scoreboard-style grid. The dataset is versioned as{" "}
            <strong>{gameConfig.datasetVersion}</strong> with <strong>{dataset.teams.length} teams</strong>.
          </p>

          <div className="my-8 grid gap-3 sm:grid-cols-3">
            <Stat label="Teams" value="138" />
            <Stat label="Conferences" value="11" />
            <Stat label="Difficulty" value="Demanding" />
          </div>

          <div className="difficulty-grid" role="radiogroup" aria-label="Difficulty">
            {gameConfig.difficulties.map((item) => {
              const best = personalBestByDifficulty.get(item.id);
              return (
                <button
                  className="difficulty-card"
                  data-selected={item.id === difficultyId}
                  key={item.id}
                  type="button"
                  role="radio"
                  aria-checked={item.id === difficultyId}
                  onClick={() => setDifficultyId(item.id)}
                >
                  <span className="eyebrow">{item.label}</span>
                  <strong className="mt-2 block text-2xl uppercase">
                    {item.durationMs === null ? "Untimed" : formatClock(item.durationMs)}
                  </strong>
                  <span className="mt-3 block text-sm text-[var(--color-muted)]">
                    {item.id === "easy"
                      ? "Unlimited time, 20 nickname clues, broad aliases and saved runs."
                      : item.id === "medium"
                        ? "20-minute board, 10 nickname clues and standard aliases."
                        : "10-minute board, no clues, strict answers after Enter."}
                  </span>
                  <span className="mt-4 block text-sm">
                    Personal best:{" "}
                    {best ? `${best.score}/${best.total} in ${formatElapsed(best.elapsedMs)}` : "No run yet"}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button className="button primary" type="button" onClick={() => startGame(false)}>
              <Play size={18} aria-hidden="true" />
              Start Game
            </button>
            {savedAttempt ? (
              <button className="button" type="button" onClick={() => startGame(true)}>
                <RotateCcw size={18} aria-hidden="true" />
                Resume saved run
              </button>
            ) : null}
            <a className="button ghost" href="/games/college-football/fbs-teams/leaderboard">
              <Trophy size={18} aria-hidden="true" />
              Leaderboard
            </a>
          </div>
        </section>
      </main>
    );
  }

  if (phase === "active" && attempt) {
    return (
      <main className="game-shell">
        <div className="sr-only" aria-live="polite">{liveMessage}</div>
        <div className="sr-only" role="alert">{assertiveMessage}</div>
        <section className="game-header" aria-label="Game status">
          <button className="button ghost" type="button" onClick={() => setPhase("intro")}>
            Back
          </button>
          <div className="score-strip">
            <Stat label="Difficulty" value={difficulty.label} compact />
            <Stat label="Score" value={`${attempt.solvedTeamIds.length} / ${dataset.teams.length}`} compact />
            <Stat label="Remaining" value={`${dataset.teams.length - attempt.solvedTeamIds.length}`} compact />
            <Stat label={difficulty.durationMs === null ? "Elapsed" : "Timer"} value={difficulty.durationMs === null ? formatElapsed(elapsedMs) : formatClock(remainingMs)} compact />
          </div>
          <button className="button" type="button" onClick={() => setShowEndDialog(true)}>
            End Game
          </button>
        </section>

        <section className="answer-rack" aria-label="Answer entry" data-correct={correctFlash}>
          <label className="sr-only" htmlFor="answer-input">Type a school</label>
          <input
            ref={inputRef}
            id="answer-input"
            className="answer-input"
            value={inputValue}
            placeholder="Type a school..."
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            onCompositionStart={() => {
              composingRef.current = true;
            }}
            onCompositionEnd={(event) => {
              composingRef.current = false;
              handleInputChange(event.currentTarget.value, false);
            }}
            onChange={(event) =>
              handleInputChange(
                event.currentTarget.value,
                "isComposing" in event.nativeEvent && Boolean(event.nativeEvent.isComposing)
              )
            }
            onKeyDown={(event) => {
              if (event.key === "Enter" && difficulty.id === "hard") {
                event.preventDefault();
                evaluateAnswer(inputValue, true);
              }
            }}
          />
          <div className="answer-meta">
            <span>{feedback || (difficulty.id === "hard" ? "Enter submits one team." : "Recognition runs while you type.")}</span>
            <span>{lastAccepted ? `Last: ${lastAccepted}` : "No answers yet"}</span>
            <span>
              {difficulty.hintsAllowed
                ? `Clues: ${cluesRemaining} / ${difficulty.clueLimit}`
                : "No clues"}
            </span>
            <span className="connection-dot" data-online={serverBacked}>
              {serverBacked ? "Verified attempt" : "Local fallback"}
            </span>
            {difficulty.hintsAllowed ? (
              <button className="button ghost" type="button" onClick={revealHint} disabled={!canRevealHint}>
                <Lightbulb size={16} aria-hidden="true" />
                Reveal hint
              </button>
            ) : null}
          </div>
        </section>

        <ConferenceGrid
          dataset={dataset}
          solvedTeamIds={solvedTeamIds}
          hintedTeamIds={hintedTeamIds}
          recentTeamIds={recentTeamIds}
          expandedConference={expandedConference}
          onToggleConference={(conference) =>
            setExpandedConference((current) => (current === conference ? null : conference))
          }
        />

        {showEndDialog ? (
          <div className="dialog-backdrop" role="presentation">
            <section className="dialog-panel" role="dialog" aria-modal="true" aria-labelledby="end-title">
              <h2 id="end-title" className="text-2xl font-black uppercase">End this run?</h2>
              <p className="mt-2 text-[var(--color-muted)]">
                Your current score will be saved to local history.
              </p>
              <div className="mt-5 flex gap-3">
                <button className="button primary" type="button" onClick={() => {
                  setShowEndDialog(false);
                  finishAttempt("ended", attempt, Date.now());
                }}>
                  End Game
                </button>
                <button className="button" type="button" onClick={() => setShowEndDialog(false)}>
                  Keep Playing
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </main>
    );
  }

  return (
    <main className="game-shell">
      {summary && attempt && finishedAt !== null ? (
        <section className="results-panel">
          <p className="eyebrow">{finishStatus === "completed" ? "Complete" : finishStatus === "expired" ? "Time expired" : "Run ended"}</p>
          <h1 className="display-title">{summary.score} / {summary.total}</h1>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Percentage" value={`${summary.percentage}%`} />
            <Stat label="Difficulty" value={difficultyById(gameConfig.difficulties, attempt.difficulty).label} />
            <Stat label="Time used" value={formatElapsed(finishedAt - attempt.startedAt)} />
            <Stat label="Conferences" value={`${summary.conferencesCompleted} / 11`} />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <ResultLine label="Best conference" value={summary.bestConference ? `${summary.bestConference.label} (${summary.bestConference.solved}/${summary.bestConference.total})` : "None"} />
            <ResultLine label="Weakest conference" value={summary.weakestConference ? `${summary.weakestConference.label} (${summary.weakestConference.solved}/${summary.weakestConference.total})` : "None"} />
            <ResultLine label="Hints used" value={`${attempt.hintCount}`} />
            <ResultLine label="Resumed" value={attempt.resumed ? "Yes" : "No"} />
            <ResultLine
              label="Leaderboard eligible"
              value={
                isLeaderboardEligible({
                  difficulty: attempt.difficulty,
                  hintCount: attempt.hintCount,
                  resumed: attempt.resumed,
                  serverIssued: serverBacked,
                  status: finishStatus
                })
                  ? "Yes"
                  : "No"
              }
            />
            <ResultLine label="Answers per minute" value={`${summary.answersPerMinute}`} />
          </div>

          <details className="mt-5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <summary className="cursor-pointer font-bold">Teams missed by conference</summary>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {summary.conferenceResults.map((result) => (
                <div key={result.conference} className="rounded-md border border-[var(--color-border)] p-3">
                  <strong>{result.label}</strong>
                  <p className="text-sm text-[var(--color-muted)]">{result.solved} / {result.total}</p>
                  <p className="mt-2 text-sm">
                    {result.missedTeamIds.length
                      ? result.missedTeamIds.map((id) => findTeam(dataset, id).displaySchool).join(", ")
                      : "Completed"}
                  </p>
                </div>
              ))}
            </div>
          </details>

          <details className="mt-5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <summary className="cursor-pointer font-bold">Advanced splits</summary>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <ResultLine label="First correct" value={summary.firstCorrectMs === null ? "None" : formatElapsed(summary.firstCorrectMs)} />
              <ResultLine label="Last correct" value={summary.lastCorrectMs === null ? "None" : formatElapsed(summary.lastCorrectMs)} />
              <ResultLine label="Longest gap" value={summary.longestGapMs === null ? "None" : formatElapsed(summary.longestGapMs)} />
              <ResultLine label="Final 60 seconds" value={`${summary.finalMinuteScore} answers`} />
            </div>
          </details>

          <section className="mt-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <h2 className="text-xl font-black uppercase">Leaderboard profile</h2>
            {submissionComplete ? (
              <div className="mt-4 rounded-md border border-[rgba(113,228,138,0.42)] bg-[rgba(113,228,138,0.08)] p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-1 text-[var(--color-success)]" size={22} aria-hidden="true" />
                  <div>
                    <strong className="block text-lg">Thank you, your result was saved.</strong>
                    <p className="mt-1 text-sm text-[var(--color-muted)]">
                      {submissionMessage || "Your leaderboard submission is complete."}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link className="button primary" href="/">
                    <Home size={17} aria-hidden="true" />
                    Back to Home
                  </Link>
                  <Link className="button" href="/games/college-football/fbs-teams/leaderboard">
                    <Trophy size={17} aria-hidden="true" />
                    View Leaderboard
                  </Link>
                  <button className="button ghost" type="button" onClick={shareResult}>
                    <Clipboard size={17} aria-hidden="true" />
                    Share Result
                  </button>
                </div>
                {shareMessage ? <p className="mt-3 text-sm text-[var(--color-muted)]">{shareMessage}</p> : null}
              </div>
            ) : (
              <>
                <p className="mt-2 text-sm text-[var(--color-muted)]">
                  Your display name, city and country may appear publicly on leaderboards. Do not enter
                  your full legal name unless you deliberately want it public.
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <label className="grid gap-1">
                    <span className="text-sm font-bold">Display name</span>
                    <input className="answer-input !min-h-11 !text-base" value={profileName} maxLength={32} onChange={(event) => setProfileName(event.target.value)} />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-sm font-bold">City</span>
                    <input className="answer-input !min-h-11 !text-base" value={profileCity} maxLength={40} onChange={(event) => setProfileCity(event.target.value)} />
                  </label>
                  <label className="grid gap-1">
                    <span className="text-sm font-bold">Country</span>
                    <select className="answer-input !min-h-11 !text-base" value={profileCountry} onChange={(event) => setProfileCountry(event.target.value)}>
                      <option value="US">United States</option>
                      <option value="GB">United Kingdom</option>
                      <option value="CA">Canada</option>
                      <option value="AU">Australia</option>
                      <option value="IE">Ireland</option>
                      <option value="NZ">New Zealand</option>
                    </select>
                  </label>
                  <label className="flex min-h-11 items-center gap-2 pt-6">
                    <input type="checkbox" checked={showCity} onChange={(event) => setShowCity(event.target.checked)} />
                    <span>Show city</span>
                  </label>
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button className="button primary" type="button" onClick={submitProfile} disabled={submittingResult}>
                    <Flag size={17} aria-hidden="true" />
                    {submittingResult ? "Saving..." : "Save Result"}
                  </button>
                  <button className="button" type="button" onClick={shareResult}>
                    <Clipboard size={17} aria-hidden="true" />
                    Share Result
                  </button>
                </div>
                <p className="mt-3 text-sm text-[var(--color-muted)]">{submissionMessage || shareMessage}</p>
              </>
            )}
          </section>

          <div className="mt-6 flex flex-wrap gap-3">
            <button className="button primary" type="button" onClick={() => startGame(false)}>
              <RotateCcw size={18} aria-hidden="true" />
              Play Again
            </button>
            <button className="button" type="button" onClick={() => setPhase("intro")}>
              Change Difficulty
            </button>
            <a className="button ghost" href="/games/college-football/fbs-teams/leaderboard">
              View Leaderboard
            </a>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function Stat({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) {
  return (
    <div className="score-tile">
      <span>{label}</span>
      <strong className={`metric ${compact ? "" : "text-3xl"}`}>{value}</strong>
    </div>
  );
}

function ResultLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <span className="block text-xs font-black uppercase tracking-[0.08em] text-[var(--color-muted)]">{label}</span>
      <strong className="mt-1 block text-lg">{value}</strong>
    </div>
  );
}

function buildShareText(summary: AttemptSummary, difficulty: DifficultyId, elapsedMs: number): string {
  const labels: Record<DifficultyId, string> = {
    easy: "Easy",
    medium: "Medium",
    hard: "Hard"
  };
  const rows = summary.conferenceResults.map((result) => {
    const ratio = result.solved / result.total;
    if (ratio === 1) return "🟩";
    if (ratio >= 0.5) return "🟨";
    return "🟥";
  });
  return [
    "ball knowers: all teams quiz",
    `${labels[difficulty]} · 2026 Alignment`,
    "",
    `${summary.score}/${summary.total}`,
    `${summary.conferencesCompleted}/11 conferences completed`,
    formatElapsed(elapsedMs),
    "",
    `${rows.slice(0, 4).join("")}`,
    `${rows.slice(4, 8).join("")}`,
    `${rows.slice(8).join("")}`
  ].join("\n");
}
