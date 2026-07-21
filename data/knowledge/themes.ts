import type { CSSProperties } from "react";
import type { KnowledgeQuizTheme } from "./types";

export type KnowledgeThemeKey = "cfb" | "nfl" | "english" | "europe" | "world";

export const knowledgeThemes = {
  cfb: {
    accent: "#FF3F8F",
    accentHover: "#FF8FC5",
    tint: "rgba(255, 63, 143, 0.2)",
    background: "#eaf8ff",
    surface: "rgba(247, 252, 255, 0.74)",
    raised: "rgba(255, 255, 255, 0.9)",
    border: "rgba(105, 148, 184, 0.34)"
  },
  nfl: {
    accent: "#00D084",
    accentHover: "#8BFFD2",
    tint: "rgba(0, 208, 132, 0.19)",
    background: "#eaf8ff",
    surface: "rgba(247, 252, 255, 0.74)",
    raised: "rgba(255, 255, 255, 0.9)",
    border: "rgba(105, 148, 184, 0.34)"
  },
  english: {
    accent: "#00B8FF",
    accentHover: "#8CF5FF",
    tint: "rgba(0, 184, 255, 0.2)",
    background: "#eaf8ff",
    surface: "rgba(247, 252, 255, 0.74)",
    raised: "rgba(255, 255, 255, 0.9)",
    border: "rgba(105, 148, 184, 0.34)"
  },
  europe: {
    accent: "#8B5CF6",
    accentHover: "#C4B5FD",
    tint: "rgba(139, 92, 246, 0.2)",
    background: "#eaf8ff",
    surface: "rgba(247, 252, 255, 0.74)",
    raised: "rgba(255, 255, 255, 0.9)",
    border: "rgba(105, 148, 184, 0.34)"
  },
  world: {
    accent: "#F5A524",
    accentHover: "#FFE08A",
    tint: "rgba(245, 165, 36, 0.22)",
    background: "#eaf8ff",
    surface: "rgba(247, 252, 255, 0.74)",
    raised: "rgba(255, 255, 255, 0.9)",
    border: "rgba(105, 148, 184, 0.34)"
  }
} satisfies Record<KnowledgeThemeKey, KnowledgeQuizTheme>;

export function quizThemeStyle(theme: KnowledgeQuizTheme): CSSProperties {
  return {
    "--color-bg": "#eaf8ff",
    "--color-surface": "rgba(247, 252, 255, 0.74)",
    "--color-surface-2": "rgba(255, 255, 255, 0.9)",
    "--color-border": "rgba(105, 148, 184, 0.34)",
    "--color-border-strong": "rgba(28, 79, 118, 0.42)",
    "--color-accent": theme.accent,
    "--color-accent-hover": theme.accentHover,
    "--color-accent-2": theme.accentHover,
    "--quiz-bg": "#eaf8ff",
    "--quiz-tint": theme.tint
  } as CSSProperties;
}
