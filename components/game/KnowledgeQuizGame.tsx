"use client";

import { CheckCircle, Home, Play, RotateCcw } from "lucide-react";
import Link from "next/link";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import type { KnowledgeQuiz, KnowledgeQuizEntry, TimePreset } from "@/data/knowledge/types";
import { normaliseAnswer } from "@/lib/quiz/normalise";
import { formatClock, formatElapsed } from "@/lib/quiz/timer";
import { resolveTimeLimitMs, TimeLimitPicker } from "./TimeLimitPicker";

type Phase = "intro" | "active" | "results";
type FinishStatus = "completed" | "expired" | "ended";

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
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [finishedAt, setFinishedAt] = useState<number | null>(null);
  const [deadlineAt, setDeadlineAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [finishStatus, setFinishStatus] = useState<FinishStatus>("ended");
  const [showEndDialog, setShowEndDialog] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const composingRef = useRef(false);
  const finishedRef = useRef(false);
  const flashTimerRef = useRef<number | null>(null);
  const recentTimerRef = useRef<number | null>(null);

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
  const layout = quiz.layout ?? "cards";
  const solvedSet = useMemo(() => new Set(solvedEntryIds), [solvedEntryIds]);
  const remainingMs = Math.max(0, (deadlineAt ?? now) - now);
  const elapsedMs =
    startedAt === null ? 0 : Math.max(0, (finishedAt ?? now) - startedAt);
  const score = solvedEntryIds.length;
  const total = activeEntries.length;
  const selectedLimitMs = resolveTimeLimitMs(timePreset, customMinutes, customSeconds);

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

  function triggerCorrectFeedback() {
    setCorrectFlash(true);
    if (flashTimerRef.current !== null) window.clearTimeout(flashTimerRef.current);
    flashTimerRef.current = window.setTimeout(() => setCorrectFlash(false), 700);
  }

  function startGame() {
    const start = Date.now();
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
    triggerCorrectFeedback();
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

  function handleInputChange(value: string, isComposing: boolean) {
    setInputValue(value);
    if ((mode.autoSubmit ?? true) && !isComposing && !composingRef.current) {
      evaluateAnswer(value, false);
    }
  }

  const themeStyle = {
    "--color-bg": quiz.theme.background,
    "--color-surface": quiz.theme.surface,
    "--color-surface-2": quiz.theme.raised,
    "--color-border": quiz.theme.border,
    "--color-border-strong": quiz.theme.border,
    "--color-accent": quiz.theme.accent,
    "--color-accent-hover": quiz.theme.accentHover,
    "--color-accent-2": quiz.theme.accentHover,
    "--quiz-bg": quiz.theme.background,
    "--quiz-tint": quiz.theme.tint
  } as CSSProperties;

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
              placeholder={quiz.placeholder}
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
              <span>{feedback || "Recognition runs while you type."}</span>
              <span>{lastAccepted ? `Last: ${lastAccepted}` : "No answers yet"}</span>
              <span>{mode.solve === "cascade" ? "Repeat answers fill together" : "One slot per answer"}</span>
            </div>
          </section>
        </div>

        <KnowledgeGrid
          groups={groups}
          solvedSet={solvedSet}
          recentEntryIds={recentEntryIds}
          layout={layout}
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
          <Stat label="Mode" value={mode.label} />
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
                This quiz is saved for local play in this first version. Public leaderboards can be added after the quiz tables are stable.
              </p>
            </div>
          </div>
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
        </div>
      </section>
    </main>
  );
}

function KnowledgeGrid({
  groups,
  solvedSet,
  recentEntryIds,
  layout
}: {
  groups: EntryGroup[];
  solvedSet: Set<string>;
  recentEntryIds: Set<string>;
  layout: NonNullable<KnowledgeQuiz["layout"]>;
}) {
  return (
    <section className="knowledge-grid" data-layout={layout} aria-label="Quiz table">
      {groups.map((group) => {
        const solved = group.entries.filter((entry) => solvedSet.has(entry.id)).length;
        return (
          <article className="knowledge-card" key={group.label} data-complete={solved === group.entries.length}>
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
                const tone = entry.tone || entry.prompt;
                return (
                  <li
                    key={entry.id}
                    className="knowledge-slot"
                    data-revealed={revealed}
                    data-recent={recentEntryIds.has(entry.id)}
                  >
                    <span className="slot-index">{index + 1}</span>
                    <span className="knowledge-prompt">
                      <span className="knowledge-tone" style={toneStyle(tone)}>
                        {tone}
                      </span>
                      {entry.tone ? <small>{entry.prompt}</small> : null}
                    </span>
                    <span className="knowledge-answer">
                      {revealed ? entry.answer : "Open slot"}
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
