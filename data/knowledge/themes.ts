import type { CSSProperties } from "react";
import type { KnowledgeQuizTheme } from "./types";

export type KnowledgeThemeKey = "cfb" | "nfl" | "english" | "europe" | "world";

const cleanTheme = {
  accent: "#74B8FF",
  accentHover: "#A6D2FF",
  tint: "transparent",
  background: "#070A0F",
  surface: "#10161F",
  raised: "#151D28",
  border: "#273241"
} satisfies KnowledgeQuizTheme;

export const knowledgeThemes = {
  cfb: cleanTheme,
  nfl: cleanTheme,
  english: cleanTheme,
  europe: cleanTheme,
  world: cleanTheme
} satisfies Record<KnowledgeThemeKey, KnowledgeQuizTheme>;

export function quizThemeStyle(theme: KnowledgeQuizTheme): CSSProperties {
  return {
    "--color-bg": theme.background,
    "--color-surface": theme.surface,
    "--color-surface-2": theme.raised,
    "--color-border": theme.border,
    "--color-border-strong": "#364456",
    "--color-accent": theme.accent,
    "--color-accent-hover": theme.accentHover,
    "--color-accent-2": theme.accentHover,
    "--quiz-bg": theme.background,
    "--quiz-tint": theme.tint
  } as CSSProperties;
}
