export type TimePreset = "300" | "600" | "1200" | "custom";

export type KnowledgeQuizTheme = {
  accent: string;
  accentHover: string;
  tint: string;
  background: string;
  surface: string;
  raised: string;
  border: string;
};

export type KnowledgeQuizMode = {
  id: string;
  label: string;
  description: string;
  solve: "cascade" | "single";
  autoSubmit?: boolean;
};

export type KnowledgeQuizEntry = {
  id: string;
  modeIds: string[];
  prompt: string;
  answer: string;
  aliases: string[];
  group: string;
  detail?: string;
  tone?: string;
  role?: "winner" | "runner-up" | "third" | "team" | "club";
  runnerUp?: boolean;
};

export type KnowledgeQuiz = {
  id: string;
  title: string;
  eyebrow: string;
  description: string;
  answerLabel: string;
  placeholder: string;
  theme: KnowledgeQuizTheme;
  layout?: "cards" | "compact" | "mega";
  modes: KnowledgeQuizMode[];
  entries: KnowledgeQuizEntry[];
  runnerUpToggle?: {
    label: string;
    description: string;
  };
};
