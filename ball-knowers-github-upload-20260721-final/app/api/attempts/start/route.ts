import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { fbsGameConfig } from "@/data/fbs/game-config";
import type { DifficultyId } from "@/data/fbs/types";
import { difficultyById } from "@/lib/quiz/matcher";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getServiceSupabase, isSupabaseConfigured } from "@/lib/server/supabase";

export async function POST(request: NextRequest) {
  const ipKey = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  if (!checkRateLimit(`start:${ipKey}`, 30, 60_000)) {
    return NextResponse.json({ error: "Too many attempt starts." }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as
    | { quizId?: string; datasetVersion?: string; difficulty?: DifficultyId }
    | null;
  if (
    !body ||
    body.quizId !== fbsGameConfig.id ||
    body.datasetVersion !== fbsGameConfig.datasetVersion ||
    !body.difficulty
  ) {
    return NextResponse.json({ error: "Invalid attempt request." }, { status: 400 });
  }

  const difficulty = difficultyById(fbsGameConfig.difficulties, body.difficulty);
  const now = Date.now();
  const attempt = {
    attemptId: randomUUID(),
    quizId: fbsGameConfig.id,
    datasetVersion: fbsGameConfig.datasetVersion,
    difficulty: difficulty.id,
    startedAt: now,
    deadlineAt: difficulty.durationMs === null ? null : now + difficulty.durationMs,
    solvedTeamIds: [],
    hintTeamIds: [],
    hintCount: 0,
    lastUpdatedAt: now,
    answerEvents: [],
    resumed: false
  };

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      serverBacked: false,
      publicLeaderboardAvailable: false,
      attempt
    });
  }

  const supabase = getServiceSupabase();
  const { error } = await supabase!.from("quiz_attempts").insert({
    id: attempt.attemptId,
    profile_id: null,
    anonymous_session_id: request.cookies.get("anon_session")?.value ?? randomUUID(),
    quiz_id: attempt.quizId,
    dataset_version: attempt.datasetVersion,
    difficulty: attempt.difficulty,
    started_at: new Date(attempt.startedAt).toISOString(),
    deadline_at: attempt.deadlineAt ? new Date(attempt.deadlineAt).toISOString() : null,
    finished_at: null,
    score: 0,
    total: fbsGameConfig.totalAnswers,
    completed: false,
    hint_count: 0,
    resumed: false,
    eligible: false,
    status: "active"
  });

  if (error) {
    return NextResponse.json({ error: "Could not create attempt." }, { status: 500 });
  }

  return NextResponse.json({
    serverBacked: true,
    publicLeaderboardAvailable: true,
    attempt
  });
}
