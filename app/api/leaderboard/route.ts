import { NextRequest, NextResponse } from "next/server";
import { fbsGameConfig } from "@/data/fbs/game-config";
import { getServiceSupabase, isSupabaseConfigured } from "@/lib/server/supabase";

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      publicLeaderboardAvailable: false,
      entries: []
    });
  }

  const search = request.nextUrl.searchParams;
  const quizId = search.get("quizId") ?? fbsGameConfig.id;
  const datasetVersion = search.get("datasetVersion") ?? fbsGameConfig.datasetVersion;
  const difficultyParam = search.get("difficulty") ?? "overall";
  const scope = search.get("scope") ?? "global";
  const country = search.get("country");
  const city = search.get("city");
  const supabase = getServiceSupabase()!;

  let query = supabase
    .from("public_leaderboard")
    .select("*")
    .eq("quiz_id", quizId)
    .eq("dataset_version", datasetVersion)
    .eq("moderation_state", "visible")
    .order("completed", { ascending: false })
    .order("score", { ascending: false })
    .order("completion_ms", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(100);

  if (difficultyParam !== "overall") query = query.eq("difficulty", difficultyParam);
  if (scope === "country" && country) query = query.eq("country_code", country);
  if (scope === "city" && city) query = query.ilike("city", city);
  if (scope === "week") {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte("created_at", weekAgo);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "Could not load leaderboard." }, { status: 500 });
  }

  return NextResponse.json({
    publicLeaderboardAvailable: true,
    entries: data ?? []
  });
}
