import type { CSSProperties } from "react";
import type { KnowledgeQuizTheme } from "./types";

export type KnowledgeThemeKey = "cfb" | "nfl" | "english" | "europe" | "world";

export const knowledgeThemes = {
  cfb: {
    accent: "#FF3F8F",
    accentHover: "#FF8FC5",
    tint: "rgba(255, 63, 143, 0.18)",
    background: "#030508",
    surface: "rgba(10, 14, 19, 0.82)",
    raised: "rgba(18, 25, 34, 0.88)",
    border: "rgba(157, 207, 255, 0.2)"
  },
  nfl: {
    accent: "#00D084",
    accentHover: "#8BFFD2",
    tint: "rgba(0, 208, 132, 0.17)",
    background: "#030508",
    surface: "rgba(10, 14, 19, 0.82)",
    raised: "rgba(18, 25, 34, 0.88)",
    border: "rgba(157, 207, 255, 0.2)"
  },
  english: {
    accent: "#00B8FF",
    accentHover: "#8CF5FF",
    tint: "rgba(0, 184, 255, 0.18)",
    background: "#030508",
    surface: "rgba(10, 14, 19, 0.82)",
    raised: "rgba(18, 25, 34, 0.88)",
    border: "rgba(157, 207, 255, 0.2)"
  },
  europe: {
    accent: "#8B5CF6",
    accentHover: "#C4B5FD",
    tint: "rgba(139, 92, 246, 0.18)",
    background: "#030508",
    surface: "rgba(10, 14, 19, 0.82)",
    raised: "rgba(18, 25, 34, 0.88)",
    border: "rgba(157, 207, 255, 0.2)"
  },
  world: {
    accent: "#F5A524",
    accentHover: "#FFE08A",
    tint: "rgba(245, 165, 36, 0.18)",
    background: "#030508",
    surface: "rgba(10, 14, 19, 0.82)",
    raised: "rgba(18, 25, 34, 0.88)",
    border: "rgba(157, 207, 255, 0.2)"
  }
} satisfies Record<KnowledgeThemeKey, KnowledgeQuizTheme>;

export function quizThemeStyle(theme: KnowledgeQuizTheme): CSSProperties {
  return {
    "--color-bg": "#030508",
    "--color-surface": "rgba(10, 14, 19, 0.82)",
    "--color-surface-2": "rgba(18, 25, 34, 0.88)",
    "--color-border": "rgba(157, 207, 255, 0.2)",
    "--color-border-strong": "rgba(202, 235, 255, 0.32)",
    "--color-accent": theme.accent,
    "--color-accent-hover": theme.accentHover,
    "--color-accent-2": theme.accentHover,
    "--quiz-bg": "#030508",
    "--quiz-tint": theme.tint
  } as CSSProperties;
}
