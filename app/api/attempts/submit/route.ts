import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { fbs2026Dataset } from "@/data/fbs/fbs-2026.1";
import { fbsGameConfig } from "@/data/fbs/game-config";
import type { DifficultyId } from "@/data/fbs/types";
import { isLeaderboardEligible } from "@/lib/quiz/results";
import { sanitisePublicText, validateCity, validateDisplayName } from "@/lib/quiz/profile";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getServiceSupabase, isSupabaseConfigured } from "@/lib/server/supabase";

type SubmitBody = {
  profile?: {
    displayName?: string;
    city?: string | null;
    countryCode?: string;
    showCity?: boolean;
  };
  attempt?: {
    id?: string;
    quizId?: string;
    datasetVersion?: string;
    difficulty?: DifficultyId;
    solvedTeamIds?: string[];
    hintCount?: number;
    resumed?: boolean;
    answerEvents?: { teamId: string; clientTs: number; sequence: number }[];
    finishedAt?: number;
  };
};

export async function POST(request: NextRequest) {
  const ipKey = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "local";
  if (!checkRateLimit(`submit:${ipKey}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many submissions." }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as SubmitBody | null;
  if (!body?.attempt || !body.profile) {
    return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  }
  if (
    body.attempt.quizId !== fbsGameConfig.id ||
    body.attempt.datasetVersion !== fbsGameConfig.datasetVersion ||
    !body.attempt.difficulty
  ) {
    return NextResponse.json({ error: "Wrong quiz or dataset version." }, { status: 400 });
  }

  const displayName = sanitisePublicText(body.profile.displayName ?? "", 32);
  const city = body.profile.city ? sanitisePublicText(body.profile.city, 40) : null;
  const countryCode = (body.profile.countryCode ?? "").toUpperCase();
  const nameError = validateDisplayName(displayName);
  const cityError = validateCity(city ?? "");
  if (nameError || cityError || !/^[A-Z]{2}$/.test(countryCode)) {
    return NextResponse.json({ error: nameError ?? cityError ?? "Invalid country." }, { status: 400 });
  }

  const knownTeamIds = new Set(fbs2026Dataset.teams.map((team) => team.id));
  const solvedTeamIds = body.attempt.solvedTeamIds ?? [];
  const uniqueSolved = new Set(solvedTeamIds);
  if (uniqueSolved.size !== solvedTeamIds.length) {
    return NextResponse.json({ error: "Duplicate team IDs are not allowed." }, { status: 400 });
  }
  for (const teamId of uniqueSolved) {
    if (!knownTeamIds.has(teamId)) {
      return NextResponse.json({ error: "Unknown team ID in submission." }, { status: 400 });
    }
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      publicLeaderboardAvailable: false,
      message: "Public leaderboard is unavailable until Supabase is configured."
    });
  }

  const supabase = getServiceSupabase()!;
  const { data: attemptRow, error: attemptError } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("id", body.attempt.id)
    .single();
  if (attemptError || !attemptRow) {
    return NextResponse.json({ error: "Attempt was not issued by the server." }, { status: 400 });
  }
  if (attemptRow.status !== "active") {
    return NextResponse.json({ error: "Attempt has already been submitted." }, { status: 409 });
  }

  const startedAt = new Date(attemptRow.started_at).getTime();
  const finishedAt = body.attempt.finishedAt ?? Date.now();
  const completionMs = Math.max(0, finishedAt - startedAt);
  const completed = uniqueSolved.size === fbsGameConfig.totalAnswers;
  const expired =
    attemptRow.deadline_at !== null && finishedAt > new Date(attemptRow.deadline_at).getTime() + 2_000;
  const impossibleVelocity = completed && completionMs < 8_000;
  const eligible =
    !impossibleVelocity &&
    isLeaderboardEligible({
      difficulty: body.attempt.difficulty,
      hintCount: body.attempt.hintCount ?? 0,
      resumed: Boolean(body.attempt.resumed),
      serverIssued: true,
      status: expired ? "expired" : completed ? "completed" : "ended"
    });

  const profileId = randomUUID();
  const { error: profileError } = await supabase.from("profiles").insert({
    id: profileId,
    display_name: displayName,
    city,
    country_code: countryCode,
    show_city: body.profile.showCity ?? true
  });
  if (profileError) {
    return NextResponse.json({ error: "Could not create profile." }, { status: 500 });
  }

  const { error: updateError } = await supabase
    .from("quiz_attempts")
    .update({
      profile_id: profileId,
      finished_at: new Date(finishedAt).toISOString(),
      score: uniqueSolved.size,
      completed,
      hint_count: body.attempt.hintCount ?? 0,
      resumed: Boolean(body.attempt.resumed),
      eligible,
      status: impossibleVelocity ? "flagged" : expired ? "expired" : "completed"
    })
    .eq("id", body.attempt.id);
  if (updateError) {
    return NextResponse.json({ error: "Could not store attempt." }, { status: 500 });
  }

  const answerEvents = (body.attempt.answerEvents ?? []).map((event) => ({
    id: randomUUID(),
    attempt_id: body.attempt!.id,
    team_id: event.teamId,
    client_ts: new Date(event.clientTs).toISOString(),
    sequence: event.sequence,
    difficulty: body.attempt!.difficulty
  }));
  if (answerEvents.length) {
    await supabase.from("quiz_answer_events").insert(answerEvents);
  }

  if (eligible) {
    await supabase.from("leaderboard_entries").insert({
      id: randomUUID(),
      attempt_id: body.attempt.id,
      profile_id: profileId,
      quiz_id: fbsGameConfig.id,
      dataset_version: fbsGameConfig.datasetVersion,
      difficulty: body.attempt.difficulty,
      score: uniqueSolved.size,
      total: fbsGameConfig.totalAnswers,
      completion_ms: completionMs,
      completed,
      verified: true,
      moderation_state: impossibleVelocity ? "flagged" : "visible"
    });
  }

  return NextResponse.json({
    publicLeaderboardAvailable: true,
    message: eligible ? "Result submitted." : "Result saved privately but is not leaderboard eligible."
  });
}
