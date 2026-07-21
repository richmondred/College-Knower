import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getRegisteredQuiz } from "@/lib/quiz/quiz-registry";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getServiceSupabase, isSupabaseConfigured } from "@/lib/server/supabase";

type StartBody = {
  quizId?: string;
  datasetVersion?: string;
  difficulty?: string;
  timeLimitMs?: number | null;
};

function resolveDeadline(startedAt: number, timeLimitMs: number | null | undefined) {
  if (timeLimitMs === null) return null;
  if (typeof timeLimitMs !== "number" || !Number.isFinite(timeLimitMs)) return null;
  const bounded = Math.max(1_000, Math.min(timeLimitMs, 7 * 24 * 60 * 60 * 1000));
  return startedAt + bounded;
}

export async function POST(request: NextRequest) {
  const ipKey = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  if (!checkRateLimit(`start:${ipKey}`, 30, 60_000)) {
    return NextResponse.json({ error: "Too many attempt starts." }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as StartBody | null;
  if (!body?.quizId || !body.datasetVersion || !body.difficulty) {
    return NextResponse.json({ error: "Invalid attempt request." }, { status: 400 });
  }

  const registeredQuiz = getRegisteredQuiz(body.quizId, body.datasetVersion, body.difficulty);
  if (!registeredQuiz) {
    return NextResponse.json({ error: "Invalid attempt request." }, { status: 400 });
  }

  const now = Date.now();
  const attempt = {
    attemptId: randomUUID(),
    quizId: registeredQuiz.id,
    datasetVersion: registeredQuiz.datasetVersion,
    difficulty: registeredQuiz.mode.id,
    startedAt: now,
    deadlineAt: resolveDeadline(now, body.timeLimitMs),
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
    total: registeredQuiz.mode.total,
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
