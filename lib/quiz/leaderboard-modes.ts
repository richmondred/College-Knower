export const KNOWLEDGE_LEADERBOARD_VERSION = "knowledge-2026.1";
export const RUNNER_UP_MODE_SUFFIX = "runners-up";

export function leaderboardModeId(baseModeId: string, includeRunnerUps: boolean): string {
  return includeRunnerUps ? `${baseModeId}-${RUNNER_UP_MODE_SUFFIX}` : baseModeId;
}

export function leaderboardModeLabel(baseLabel: string, includeRunnerUps: boolean): string {
  return includeRunnerUps ? `${baseLabel} + Runners Up` : baseLabel;
}
