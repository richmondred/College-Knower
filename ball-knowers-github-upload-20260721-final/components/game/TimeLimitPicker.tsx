"use client";

import { Clock } from "lucide-react";
import type { TimePreset } from "@/data/knowledge/types";
import { formatClock } from "@/lib/quiz/timer";

type TimeLimitPickerProps = {
  preset: TimePreset;
  minutes: number;
  seconds: number;
  onPresetChange: (preset: TimePreset) => void;
  onMinutesChange: (minutes: number) => void;
  onSecondsChange: (seconds: number) => void;
};

const PRESETS: { id: TimePreset; label: string }[] = [
  { id: "300", label: "5:00" },
  { id: "600", label: "10:00" },
  { id: "1200", label: "20:00" },
  { id: "custom", label: "Custom" }
];

export function resolveTimeLimitMs(preset: TimePreset, minutes: number, seconds: number): number {
  if (preset !== "custom") return Number(preset) * 1000;
  const safeMinutes = Number.isFinite(minutes) ? minutes : 0;
  const safeSeconds = Number.isFinite(seconds) ? seconds : 0;
  return Math.max(1, Math.floor(safeMinutes) * 60 + Math.floor(safeSeconds)) * 1000;
}

export function TimeLimitPicker({
  preset,
  minutes,
  seconds,
  onPresetChange,
  onMinutesChange,
  onSecondsChange
}: TimeLimitPickerProps) {
  const resolvedMs = resolveTimeLimitMs(preset, minutes, seconds);

  return (
    <section className="time-limit-panel" aria-label="Time limit">
      <div>
        <p className="eyebrow">time limit</p>
        <strong className="time-limit-value">
          <Clock size={18} aria-hidden="true" />
          {formatClock(resolvedMs)}
        </strong>
      </div>
      <div className="time-preset-grid" role="radiogroup" aria-label="Choose time limit">
        {PRESETS.map((item) => (
          <button
            key={item.id}
            className="time-preset"
            type="button"
            role="radio"
            aria-checked={preset === item.id}
            data-selected={preset === item.id}
            onClick={() => onPresetChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {preset === "custom" ? (
        <div className="custom-time-grid">
          <label>
            <span>Minutes</span>
            <input
              type="number"
              min={0}
              max={999}
              value={minutes}
              onChange={(event) => onMinutesChange(Number(event.target.value))}
            />
          </label>
          <label>
            <span>Seconds</span>
            <input
              type="number"
              min={0}
              max={59}
              value={seconds}
              onChange={(event) => onSecondsChange(Number(event.target.value))}
            />
          </label>
        </div>
      ) : null}
    </section>
  );
}
