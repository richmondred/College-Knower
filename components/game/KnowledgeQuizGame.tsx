"use client";

import { CheckCircle, Clipboard, Flag, Home, Play, RotateCcw, Trophy } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { quizThemeStyle } from "@/data/knowledge/themes";
import type { KnowledgeQuiz, KnowledgeQuizEntry, TimePreset } from "@/data/knowledge/types";
import { compareLeaderboardEntries, type LeaderboardEntry } from "@/lib/quiz/leaderboard";
import {
  KNOWLEDGE_LEADERBOARD_VERSION,
  leaderboardModeId,
  leaderboardModeLabel
} from "@/lib/quiz/leaderboard-modes";
import { normaliseAnswer } from "@/lib/quiz/normalise";
import { sanitisePublicText, validateCity, validateDisplayName } from "@/lib/quiz/profile";
import { leaderboardStorageKey, saveLocalLeaderboard } from "@/lib/quiz/storage";
import { formatClock, formatElapsed } from "@/lib/quiz/timer";
import { resolveTimeLimitMs, TimeLimitPicker } from "./TimeLimitPicker";

type Phase = "intro" | "active" | "results";
type FinishStatus = "completed" | "expired" | "ended";
type KnowledgeDensity = "standard" | "dense" | "ultra";

type KnowledgeQuizGameProps = {
  quiz: KnowledgeQuiz;
  homeHref: string;
};

type EntryGroup = {
  label: string;
  entries: KnowledgeQuizEntry[];
};

function buildGroups(entries: KnowledgeQuizEntry[]): EntryGroup[] {
  const order: string[] = [];
  const groups = new Map<string, KnowledgeQuizEntry[]>();
  for (const entry of entries) {
    if (!groups.has(entry.group)) {
      groups.set(entry.group, []);
      order.push(entry.group);
    }
    groups.get(entry.group)!.push(entry);
  }
  return order.map((label) => ({ label, entries: groups.get(label)! }));
}

function getKnowledgeDensity(
  entryCount: number,
  groupCount: number,
  layout: NonNullable<KnowledgeQuiz["layout"]>
): KnowledgeDensity {
  if ((layout === "mega" && entryCount >= 200) || entryCount >= 650 || groupCount >= 18) {
    return "ultra";
  }
  if (entryCount >= 160 || groupCount >= 10) return "dense";
  return "standard";
}

function knowledgeGroupSize(groupEntryCount: number, totalEntryCount: number) {
  if (groupEntryCount >= 600 || groupEntryCount / Math.max(totalEntryCount, 1) >= 0.5) return "massive";
  if (groupEntryCount >= 250) return "large";
  if (groupEntryCount >= 85) return "medium";
  return "small";
}

function nowIso(): string {
  return new Date().toISOString();
}

function randomId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function KnowledgeQuizGame({ quiz, homeHref }: KnowledgeQuizGameProps) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [modeId, setModeId] = useState(quiz.modes[0]?.id ?? "");
  const [includeRunnerUps, setIncludeRunnerUps] = useState(false);
  const [timePreset, setTimePreset] = useState<TimePreset>("600");
  const [customMinutes, setCustomMinutes] = useState(10);
  const [customSeconds, setCustomSeconds] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [feedback, setFeedback] = useState("");
  const [lastAccepted, setLastAccepted] = useState("");
  const [correctFlash, setCorrectFlash] = useState(false);
  const [solvedEntryIds, setSolvedEntryIds] = useState<string[]>([]);
  const [recentEntryIds, setRecentEntryIds] = useState<Set<string>>(new Set());
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [deadlineAt, setDeadlineAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [finishStatus, setFinishStatus] = useState<FinishStatus>("ended");
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [attemptId, setAttemptId] = useState("");
  const [profileName, setProfileName] = useState("");
  const [profileCity, setProfileCity] = useState("");
  const [profileCountry, setProfileCountry] = useState("US");
  const [showCity, setShowCity] = useState(true);
  const [submissionMessage, setSubmissionMessage] = useState("");
  const [submissionComplete, setSubmissionComplete] = useState(false);
  const [submittingResult, setSubmittingResult] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  const [serverBacked, setServerBacked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const composingRef = useRef(false);
  const finishedRef = useRef(false);
  const flashTimerRef = useRef<number | null>(null);
  const recentTimerRef = useRef<number | null>(null);
  const pendingScrollEntryIdRef = useRef<string | null>(null);

  const mode = useMemo(
    () => quiz.modes.find((candidate) => candidate.id === modeId) ?? quiz.modes[0],
    [modeId, quiz.modes]
  );

  const activeEntries = useMemo(
    () =>
      quiz.entries.filter(
        (entry) =>
          entry.modeIds.includes(mode.id) &&
          (!entry.runnerUp || includeRunnerUps)
      ),
    [includeRunnerUps, mode.id, quiz.entries]
  );

  const groups = useMemo(() => buildGroups(activeEntries), [activeEntries]);
  const activeEntryById = useMemo(() => {
    const entriesById = new Map<string, KnowledgeQuizEntry>();
    for (const entry of activeEntries) entriesById.set(entry.id, entry);
    return entriesById;
  }, [activeEntries]);
  const layout = quiz.layout ?? "cards";
  const total = activeEntries.length;
  const density = getKnowledgeDensity(total, groups.length, layout);
  const solvedSet = useMemo(() => new Set(solvedEntryIds), [solvedEntryIds]);
  const remainingMs = Math.max(0, (deadlineAt ?? now) - now);
  const elapsedMs =
    startedAt === null ? 0 : Math.max(0, (finishedAt ?? now) - startedAt);
  const score = solvedEntryIds.length;
  const selectedLimitMs = resolveTimeLimitMs(timePreset, customMinutes, customSeconds);
  const modeUsesRunnerUps = Boolean(quiz.runnerUpToggle && includeRunnerUps);
  const selectedLeaderboardModeId = leaderboardModeId(mode.id, modeUsesRunnerUps);
  const selectedLeaderboardModeLabel = leaderboardModeLabel(mode.label, modeUsesRunnerUps);
  const leaderboardHref = `/leaderboard?quiz=${encodeURIComponent(quiz.id)}&mode=${encodeURIComponent(selectedLeaderboardModeId)}`;
  const requiresTargetSelection = useMemo(() => {
    if (mode.solve !== "single") return false;
    const answerCounts = new Map<string, number>();
    for (const entry of activeEntries) {
      const answerKey = normaliseAnswer(entry.answer);
      answerCounts.set(answerKey, (answerCounts.get(answerKey) ?? 0) + 1);
    }
    return [...answerCounts.values()].some((count) => count > 1);
  }, [activeEntries, mode.solve]);
  const selectedEntry = selectedEntryId ? activeEntryById.get(selectedEntryId) ?? null : null;

  const matchIndex = useMemo(() => {
    const answerKeyToIds = new Map<string, string[]>();
    const aliasToAnswerKeys = new Map<string, Set<string>>();

    for (const entry of activeEntries) {
      const answerKey = normaliseAnswer(entry.answer);
      const ids = answerKeyToIds.get(answerKey) ?? [];
      ids.push(entry.id);
      answerKeyToIds.set(answerKey, ids);

      for (const alias of [entry.answer, ...entry.aliases]) {
        const aliasKey = normaliseAnswer(alias);
        if (aliasKey.length < 2) continue;
        const answerKeys = aliasToAnswerKeys.get(aliasKey) ?? new Set<string>();
        answerKeys.add(answerKey);
        aliasToAnswerKeys.set(aliasKey, answerKeys);
      }
    }

    const aliasToAnswerKey = new Map<string, string>();
    for (const [aliasKey, answerKeys] of aliasToAnswerKeys) {
      if (answerKeys.size === 1) {
        aliasToAnswerKey.set(aliasKey, [...answerKeys][0]);
      }
    }

    return { aliasToAnswerKey, answerKeyToIds };
  }, [activeEntries]);

  useEffect(() => {
    if (phase !== "active") return;
    inputRef.current?.focus({ preventScroll: true });
  }, [phase]);

  useEffect(() => {
    setSelectedEntryId(null);
  }, [includeRunnerUps, mode.id, phase]);

  useEffect(() => {
    if (!selectedEntryId) return;
    if (!activeEntryById.has(selectedEntryId) || solvedSet.has(selectedEntryId)) {
      setSelectedEntryId(null);
    }
  }, [activeEntryById, selectedEntryId, solvedSet]);

  useEffect(() => {
    if (phase !== "active" || deadlineAt === null) return;
    const interval = window.setInterval(() => {
      const nextNow = Date.now();
      setNow(nextNow);
      if (nextNow >= deadlineAt) {
        finishAttempt("expired", nextNow);
      }
    }, 250);
    return () => window.clearInterval(interval);
  }, [deadlineAt, phase]);

  useEffect(() => {
    return () => {
      if (flashTimerRef.current !== null) window.clearTimeout(flashTimerRef.current);
      if (recentTimerRef.current !== null) window.clearTimeout(recentTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (phase !== "active" || !pendingScrollEntryIdRef.current) return;
    const targetId = pendingScrollEntryIdRef.current;
    if (!recentEntryIds.has(targetId)) return;
    pendingScrollEntryIdRef.current = null;
    window.requestAnimationFrame(() => {
      scrollElementIntoViewIfNeeded(`[data-entry-id="${targetId}"]`);
    });
  }, [phase, recentEntryIds]);

  function triggerCorrectFeedback() {
    setCorrectFlash(true);
    if (flashTimerRef.current !== null) window.clearTimeout(flashTimerRef.current);
    flashTimerRef.current = window.setTimeout(() => setCorrectFlash(false), 700);
  }

  async function startGame() {
    const start = Date.now();
    const localAttemptId = randomId("knowledge-attempt");
    finishedRef.current = false;
    setSolvedEntryIds([]);
    setRecentEntryIds(new Set());
    setStartedAt(start);
    setFinishedAt(null);
    setDeadlineAt(start + selectedLimitMs);
    setNow(start);
    setFinishStatus("ended");
    setInputValue("");
    setFeedback("");
    setLastAccepted("");
    setSelectedEntryId(null);
    setAttemptId(localAttemptId);
    setServerBacked(false);
    setSubmissionMessage("");
    setSubmissionComplete(false);
    setSubmittingResult(false);
    setShareMessage("");

    try {
      const response = await fetch("/api/attempts/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          quizId: quiz.id,
          datasetVersion: KNOWLEDGE_LEADERBOARD_VERSION,
          difficulty: selectedLeaderboardModeId,
          timeLimitMs: selectedLimitMs
        })
      });
      if (response.ok) {
        const payload = (await response.json()) as {
          serverBacked: boolean;
          attempt?: { attemptId?: string };
        };
        setServerBacked(payload.serverBacked);
        if (payload.serverBacked && payload.attempt?.attemptId) {
          setAttemptId(payload.attempt.attemptId);
        }
      }
    } catch {
      setServerBacked(false);
    }

    setPhase("active");
  }

  function finishAttempt(status: FinishStatus, at = Date.now()) {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setFinishedAt(at);
    setFinishStatus(status);
    setShowEndDialog(false);
    setPhase("results");
  }

  function acceptEntryIds(ids: string[]) {
    if (!ids.length) return;
    const acceptedAt = Date.now();
    const acceptedEntries = ids
      .map((id) => activeEntries.find((entry) => entry.id === id))
      .filter((entry): entry is KnowledgeQuizEntry => Boolean(entry));

    setSolvedEntryIds((previous) => {
      const existing = new Set(previous);
      const fresh = ids.filter((id) => !existing.has(id));
      const next = [...previous, ...fresh];
      if (next.length >= total) {
        window.setTimeout(() => finishAttempt("completed", acceptedAt), 0);
      }
      return next;
    });

    flushSync(() => setInputValue(""));
    setSelectedEntryId((current) => (current && ids.includes(current) ? null : current));
    triggerCorrectFeedback();
    pendingScrollEntryIdRef.current = ids[0];
    setRecentEntryIds(new Set(ids));
    if (recentTimerRef.current !== null) window.clearTimeout(recentTimerRef.current);
    recentTimerRef.current = window.setTimeout(() => setRecentEntryIds(new Set()), 900);

    const acceptedNames = [...new Set(acceptedEntries.map((entry) => entry.answer))];
    setLastAccepted(acceptedNames.slice(0, 3).join(", "));
    setFeedback(
      ids.length > 1
        ? `Accepted and filled ${ids.length} matching slots.`
        : "Accepted."
    );
  }

  function evaluateAnswer(raw: string, submitted = false) {
    if (phase !== "active" || composingRef.current) return;
    const aliasKey = normaliseAnswer(raw);
    if (!aliasKey) return;

    if (requiresTargetSelection) {
      if (!selectedEntry || solvedSet.has(selectedEntry.id)) {
        if (submitted) setFeedback("Select the exact slot first.");
        return;
      }

      if (!entryAcceptsAlias(selectedEntry, aliasKey)) {
        if (submitted && raw.trim()) {
          setFeedback(`That does not match ${entrySlotLabel(selectedEntry)}.`);
        }
        return;
      }

      acceptEntryIds([selectedEntry.id]);
      return;
    }

    const answerKey = matchIndex.aliasToAnswerKey.get(aliasKey);
    if (!answerKey) {
      if (submitted && raw.trim()) setFeedback("No match found.");
      return;
    }

    const ids = matchIndex.answerKeyToIds.get(answerKey) ?? [];
    const freshIds = ids.filter((id) => !solvedSet.has(id));
    if (!freshIds.length) {
      setFeedback("Already answered.");
      flushSync(() => setInputValue(""));
      return;
    }

    acceptEntryIds(mode.solve === "cascade" ? freshIds : [freshIds[0]]);
  }

  function selectTargetEntry(entryId: string) {
    if (!requiresTargetSelection || solvedSet.has(entryId)) return;
    const entry = activeEntryById.get(entryId);
    if (!entry) return;
    setSelectedEntryId(entryId);
    setFeedback(`Selected ${entrySlotLabel(entry)}.`);
    inputRef.current?.focus({ preventScroll: true });
  }

  function handleInputChange(value: string, isComposing: boolean) {
    setInputValue(value);
    if ((mode.autoSubmit ?? true) && !isComposing && !composingRef.current) {
      evaluateAnswer(value, false);
    }
  }

  async function submitProfile() {
    if (submittingResult || submissionComplete || startedAt === null) return;
    const displayName = sanitisePublicText(profileName, 32);
    const city = profileCity ? sanitisePublicText(profileCity, 40) : "";
    const nameError = validateDisplayName(displayName);
    const cityError = validateCity(city);
    if (nameError || cityError) {
      setSubmissionMessage(nameError ?? cityError ?? "Check your profile details.");
      return;
    }

    setSubmittingResult(true);

    if (serverBacked) {
      try {
        const response = await fetch("/api/attempts/submit", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            profile: {
              displayName,
              city: city || null,
              countryCode: profileCountry,
              showCity
            },
            attempt: {
              id: attemptId,
              quizId: quiz.id,
              datasetVersion: KNOWLEDGE_LEADERBOARD_VERSION,
              difficulty: selectedLeaderboardModeId,
              solvedTeamIds: solvedEntryIds,
              hintCount: 0,
              resumed: false,
              answerEvents: solvedEntryIds.map((entryId, index) => ({
                teamId: entryId,
                clientTs: (finishedAt ?? Date.now()) - Math.max(0, solvedEntryIds.length - index - 1),
                sequence: index + 1
              })),
              finishedAt: finishedAt ?? Date.now()
            }
          })
        });
        const payload = (await response.json()) as {
          message?: string;
          publicLeaderboardAvailable?: boolean;
          error?: string;
        };
        if (response.ok && payload.publicLeaderboardAvailable) {
          setSubmissionMessage(payload.message ?? "Result submitted.");
          setSubmissionComplete(true);
          setSubmittingResult(false);
          return;
        }
        if (!response.ok && payload.error) {
          setSubmissionMessage(payload.error);
        }
      } catch {
        // Local fallback below.
      }
    }

    const rank = saveLocalEntry(displayName, city);
    setSubmissionMessage(
      `Saved on this device. Public leaderboard is unavailable. Local rank for ${selectedLeaderboardModeLabel}: ${rank}.`
    );
    setSubmissionComplete(true);
    setSubmittingResult(false);
  }

  function saveLocalEntry(displayName: string, city: string) {
    const entry: LeaderboardEntry = {
      id: randomId("entry"),
      attemptId: attemptId || randomId("knowledge-attempt"),
      profileId: randomId("profile"),
      quizId: quiz.id,
      datasetVersion: KNOWLEDGE_LEADERBOARD_VERSION,
      difficulty: selectedLeaderboardModeId,
      displayName,
      city: city || null,
      showCity,
      countryCode: profileCountry,
      score,
      total,
      completionMs: elapsedMs,
      completed: score === total,
      verified: true,
      moderationState: "visible",
      createdAt: nowIso(),
      updatedAt: nowIso()
    };

    const storageKey = leaderboardStorageKey(
      quiz.id,
      KNOWLEDGE_LEADERBOARD_VERSION,
      selectedLeaderboardModeId
    );
    const entries = saveLocalLeaderboard(storageKey, entry);
    const rank =
      [...entries].sort(compareLeaderboardEntries).findIndex((candidate) => candidate.id === entry.id) + 1;
    return rank;
  }

  async function shareResult() {
    const text = [
      `ball knowers: ${quiz.title}`,
      selectedLeaderboardModeLabel,
      "",
      `${score}/${total}`,
      formatElapsed(elapsedMs)
    ].join("\n");
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

  const themeStyle = quizThemeStyle(quiz.theme);

  if (phase === "intro") {
    return (
      <main className="game-shell knowledge-shell" data-quiz-layout={layout} style={themeStyle}>
        <section className="pregame-panel">
          <p className="eyebrow">{quiz.eyebrow}</p>
          <h1 className="display-title">{quiz.title}</h1>
          <p className="lead">{quiz.description}</p>

          <div className="my-8 grid gap-3 sm:grid-cols-3">
            <Stat label="Answers" value={`${total}`} />
            <Stat label="Mode" value={mode.label} />
            <Stat label="Time" value={formatClock(selectedLimitMs)} />
          </div>

          <div className="difficulty-grid" role="radiogroup" aria-label="Mode">
            {quiz.modes.map((item) => (
              <button
                key={item.id}
                className="difficulty-card"
                type="button"
                role="radio"
                aria-checked={item.id === mode.id}
                data-selected={item.id === mode.id}
                onClick={() => setModeId(item.id)}
              >
                <span className="eyebrow">mode</span>
                <strong className="mt-2 block text-2xl uppercase">{item.label}</strong>
                <span className="mt-3 block text-sm text-[var(--color-muted)]">
                  {item.description}
                </span>
              </button>
            ))}
          </div>

          {quiz.runnerUpToggle ? (
            <label className="runner-toggle">
              <input
                type="checkbox"
                checked={includeRunnerUps}
                onChange={(event) => setIncludeRunnerUps(event.target.checked)}
              />
              <span>
                <strong>{quiz.runnerUpToggle.label}</strong>
                <small>{quiz.runnerUpToggle.description}</small>
              </span>
            </label>
          ) : null}

          <TimeLimitPicker
            preset={timePreset}
            minutes={customMinutes}
            seconds={customSeconds}
            onPresetChange={setTimePreset}
            onMinutesChange={setCustomMinutes}
            onSecondsChange={setCustomSeconds}
          />

          <div className="mt-6 flex flex-wrap gap-3">
            <button className="button primary" type="button" onClick={startGame}>
              <Play size={18} aria-hidden="true" />
              Start Game
            </button>
            <Link className="button ghost" href={homeHref}>
              <Home size={18} aria-hidden="true" />
              Back
            </Link>
            <Link className="button ghost" href={`/leaderboard?quiz=${encodeURIComponent(quiz.id)}`}>
              <Trophy size={18} aria-hidden="true" />
              Leaderboard
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (phase === "active") {
    return (
      <main className="game-shell knowledge-shell" data-quiz-layout={layout} style={themeStyle}>
        <div className="game-sticky-stack">
          <section className="game-header" aria-label="Game status">
            <button className="button ghost" type="button" onClick={() => setShowEndDialog(true)}>
              Back
            </button>
            <div className="score-strip">
              <Stat label="Mode" value={mode.label} compact />
              <Stat label="Score" value={`${score} / ${total}`} compact />
              <Stat label="Remaining" value={`${total - score}`} compact />
              <Stat label="Timer" value={formatClock(remainingMs)} compact />
            </div>
            <button className="button" type="button" onClick={() => setShowEndDialog(true)}>
              End Game
            </button>
          </section>

          <section className="answer-rack" aria-label="Answer entry" data-correct={correctFlash}>
            <label className="sr-only" htmlFor="knowledge-answer-input">
              {quiz.answerLabel}
            </label>
            <input
              ref={inputRef}
              id="knowledge-answer-input"
              className="answer-input"
              value={inputValue}
              placeholder={requiresTargetSelection ? "Click a slot, then type the answer..." : quiz.placeholder}
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
                if (event.key === "Enter") {
                  event.preventDefault();
                  evaluateAnswer(inputValue, true);
                }
              }}
            />
            <div className="answer-meta">
              <span>{feedback || (requiresTargetSelection ? "Click a slot, then type the exact answer." : "Recognition runs while you type.")}</span>
              <span>{lastAccepted ? `Last: ${lastAccepted}` : "No answers yet"}</span>
              <span>
                {requiresTargetSelection
                  ? selectedEntry
                    ? `Selected: ${entrySlotLabel(selectedEntry)}`
                    : "No slot selected"
                  : mode.solve === "cascade"
                    ? "Repeat answers fill together"
                    : "One slot per answer"}
              </span>
            </div>
          </section>
        </div>

        <KnowledgeGrid
          groups={groups}
          solvedSet={solvedSet}
          recentEntryIds={recentEntryIds}
          layout={layout}
          density={density}
          requiresTargetSelection={requiresTargetSelection}
          selectedEntryId={selectedEntryId}
          onSelectEntry={selectTargetEntry}
        />

        {showEndDialog ? (
          <div className="dialog-backdrop" role="presentation">
            <section className="dialog-panel" role="dialog" aria-modal="true" aria-labelledby="knowledge-end-title">
              <h2 id="knowledge-end-title" className="text-2xl font-black uppercase">End this run?</h2>
              <p className="mt-2 text-[var(--color-muted)]">Your current score will be shown on the results screen.</p>
              <div className="mt-5 flex gap-3">
                <button className="button primary" type="button" onClick={() => finishAttempt("ended")}>
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

  const missedEntries = activeEntries.filter((entry) => !solvedSet.has(entry.id));
  const missedGroups = buildGroups(missedEntries);

  return (
    <main className="game-shell knowledge-shell" style={themeStyle}>
      <section className="results-panel">
        <p className="eyebrow">
          {finishStatus === "completed" ? "Complete" : finishStatus === "expired" ? "Time expired" : "Run ended"}
        </p>
        <h1 className="display-title">{score} / {total}</h1>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Mode" value={selectedLeaderboardModeLabel} />
          <Stat label="Time Used" value={formatElapsed(elapsedMs)} />
          <Stat label="Missed" value={`${missedEntries.length}`} />
          <Stat label="Accuracy" value={`${total ? Math.round((score / total) * 100) : 0}%`} />
        </div>

        <section className="mt-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="mt-1 text-[var(--color-accent)]" size={22} aria-hidden="true" />
            <div>
              <strong className="block text-lg">Thanks for playing.</strong>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Save this run to the leaderboard for this quiz and mode.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
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
                <Link className="button" href={leaderboardHref}>
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
                Your display name, city and country may appear on leaderboards saved on this device.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <label className="grid gap-1">
                  <span className="text-sm font-bold">Display name</span>
                  <input
                    className="answer-input !min-h-11 !text-base"
                    value={profileName}
                    maxLength={32}
                    onChange={(event) => setProfileName(event.target.value)}
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-sm font-bold">City</span>
                  <input
                    className="answer-input !min-h-11 !text-base"
                    value={profileCity}
                    maxLength={40}
                    onChange={(event) => setProfileCity(event.target.value)}
                  />
                </label>
                <label className="grid gap-1">
                  <span className="text-sm font-bold">Country</span>
                  <select
                    className="answer-input !min-h-11 !text-base"
                    value={profileCountry}
                    onChange={(event) => setProfileCountry(event.target.value)}
                  >
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
                <Link className="button ghost" href={leaderboardHref}>
                  <Trophy size={17} aria-hidden="true" />
                  View Leaderboard
                </Link>
              </div>
              <p className="mt-3 text-sm text-[var(--color-muted)]">{submissionMessage || shareMessage}</p>
            </>
          )}
        </section>

        {missedGroups.length ? (
          <details className="mt-5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <summary className="cursor-pointer font-bold">Missed answers</summary>
            <div className="knowledge-missed-grid">
              {missedGroups.map((group) => (
                <div key={group.label} className="knowledge-missed-group">
                  <strong>{group.label}</strong>
                  <p>{group.entries.map((entry) => entry.answer).join(", ")}</p>
                </div>
              ))}
            </div>
          </details>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button className="button primary" type="button" onClick={startGame}>
            <RotateCcw size={18} aria-hidden="true" />
            Play Again
          </button>
          <button className="button" type="button" onClick={() => setPhase("intro")}>
            Change Mode
          </button>
          <Link className="button ghost" href={homeHref}>
            Back
          </Link>
          <Link className="button ghost" href={leaderboardHref}>
            View Leaderboard
          </Link>
        </div>
      </section>
    </main>
  );
}

function KnowledgeGrid({
  groups,
  solvedSet,
  recentEntryIds,
  layout,
  density,
  requiresTargetSelection,
  selectedEntryId,
  onSelectEntry
}: {
  groups: EntryGroup[];
  solvedSet: Set<string>;
  recentEntryIds: Set<string>;
  layout: NonNullable<KnowledgeQuiz["layout"]>;
  density: KnowledgeDensity;
  requiresTargetSelection: boolean;
  selectedEntryId: string | null;
  onSelectEntry: (entryId: string) => void;
}) {
  const totalEntries = groups.reduce((sum, group) => sum + group.entries.length, 0);
  const compactPlaceholder = density === "ultra" || layout === "mega";

  return (
    <section className="knowledge-grid" data-layout={layout} data-density={density} aria-label="Quiz table">
      {groups.map((group) => {
        const solved = group.entries.filter((entry) => solvedSet.has(entry.id)).length;
        return (
          <article
            className="knowledge-card"
            key={group.label}
            data-complete={solved === group.entries.length}
            data-group-size={knowledgeGroupSize(group.entries.length, totalEntries)}
          >
            <header className="knowledge-card-header">
              <div>
                <strong>{group.label}</strong>
                <span>{solved} / {group.entries.length}</span>
              </div>
              <div
                className="conference-progress"
                style={{ "--progress": `${Math.round((solved / group.entries.length) * 100)}%` } as CSSProperties}
              />
            </header>
            <ol className="knowledge-list">
              {group.entries.map((entry, index) => {
                const revealed = solvedSet.has(entry.id);
                const selectable = requiresTargetSelection && !revealed;
                const tone = entry.tone || entry.prompt;
                return (
                  <li
                    key={entry.id}
                    className="knowledge-slot"
                    data-entry-id={entry.id}
                    data-revealed={revealed}
                    data-recent={recentEntryIds.has(entry.id)}
                    data-selectable={selectable}
                    data-selected={selectedEntryId === entry.id}
                    data-entry-role={entry.role ?? "entry"}
                    role={selectable ? "button" : undefined}
                    tabIndex={selectable ? 0 : undefined}
                    aria-label={selectable ? `Select ${entrySlotLabel(entry)} slot` : undefined}
                    onClick={() => {
                      if (selectable) onSelectEntry(entry.id);
                    }}
                    onKeyDown={(event) => {
                      if (!selectable || (event.key !== "Enter" && event.key !== " ")) return;
                      event.preventDefault();
                      onSelectEntry(entry.id);
                    }}
                  >
                    <span className="slot-index">{index + 1}</span>
                    <span className="knowledge-prompt">
                      <span className="knowledge-tone" style={toneStyle(tone)}>
                        {tone}
                      </span>
                      {entry.tone ? <small>{entry.prompt}</small> : null}
                    </span>
                    <span className="knowledge-answer">
                      {revealed ? entry.answer : compactPlaceholder ? "Open" : "Open slot"}
                    </span>
                    {entry.detail ? <span className="knowledge-detail">{entry.detail}</span> : null}
                  </li>
                );
              })}
            </ol>
          </article>
        );
      })}
    </section>
  );
}

function entryAcceptsAlias(entry: KnowledgeQuizEntry, aliasKey: string) {
  return [entry.answer, ...entry.aliases].some((alias) => normaliseAnswer(alias) === aliasKey);
}

function entrySlotLabel(entry: KnowledgeQuizEntry) {
  return entry.detail ? `${entry.prompt} (${entry.detail})` : entry.prompt;
}

function scrollElementIntoViewIfNeeded(selector: string) {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) return;
  const rect = element.getBoundingClientRect();
  const stickyTop = window.matchMedia("(max-width: 720px)").matches ? 118 : 158;
  const lowerEdge = window.innerHeight - 24;
  if (rect.top < stickyTop || rect.bottom > lowerEdge) {
    element.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  }
}

function toneStyle(tone: string): CSSProperties {
  const palette = [
    "#F43F5E",
    "#38BDF8",
    "#22C55E",
    "#F59E0B",
    "#A78BFA",
    "#14B8A6",
    "#F97316",
    "#84CC16",
    "#EC4899",
    "#60A5FA",
    "#EAB308",
    "#C084FC"
  ];
  let hash = 0;
  for (const char of tone) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return { "--entry-tone": palette[hash % palette.length] } as CSSProperties;
}

function Stat({ label, value, compact = false }: { label: string; value: string; compact?: boolean }) {
  return (
    <div className="score-tile">
      <span>{label}</span>
      <strong className={`metric ${compact ? "" : "text-3xl"}`}>{value}</strong>
    </div>
  );
}
