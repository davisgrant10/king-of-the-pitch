"use server";

import { revalidatePath } from "next/cache";
import { supabaseAdmin, supabaseRead } from "@/lib/supabase/server";
import { buildRound, buildCrownMatch, type HistoryEntry } from "@/lib/matchmaking";

/**
 * Server actions = the app's write API. They run on the server with the
 * service-role client; the browser only ever posts an intent ("generate a
 * round", "this match ended 3-1") and re-renders from fresh data.
 * Atomicity lives in the database: create_round and submit_result are
 * Postgres functions, so each call commits fully or not at all.
 */

async function seasonHistory(seasonId: string, night: string): Promise<HistoryEntry[]> {
  const { data, error } = await supabaseRead()
    .from("matches")
    .select("id, night_date, match_rosters(player_id, side)")
    .eq("season_id", seasonId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((m) => ({
    a: m.match_rosters.filter((r) => r.side === "a").map((r) => r.player_id),
    b: m.match_rosters.filter((r) => r.side === "b").map((r) => r.player_id),
    tonight: m.night_date === night,
  }));
}

export async function generateRound(formData: FormData) {
  const seasonId = String(formData.get("seasonId"));
  const night = String(formData.get("night"));
  const maxPitches = Number(formData.get("pitches") || 2);
  const balance = formData.get("balance") === "skill" ? "skill" : "mix";

  const admin = supabaseAdmin();

  const [{ data: members, error: mErr }, history, { data: rounds }] = await Promise.all([
    admin
      .from("season_players")
      .select("player_id, players(id, club, skill)")
      .eq("season_id", seasonId),
    seasonHistory(seasonId, night),
    admin
      .from("matches")
      .select("round_no")
      .eq("season_id", seasonId)
      .eq("night_date", night)
      .order("round_no", { ascending: false })
      .limit(1),
  ]);
  if (mErr) throw new Error(mErr.message);

  const players = (members ?? []).map((m) => m.players!).filter(Boolean);
  const roundNo = (rounds?.[0]?.round_no ?? 0) + 1;
  const round = buildRound(players, history, { roundNo, maxPitches, balance });
  if (!round) throw new Error("Need at least 6 players in the season to draw a round.");

  const { error } = await admin.rpc("create_round", {
    p_season_id: seasonId,
    p_night: night,
    p_fixtures: round.fixtures as unknown as never,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function generateCrownMatch(formData: FormData) {
  const seasonId = String(formData.get("seasonId"));
  const night = String(formData.get("night"));
  const admin = supabaseAdmin();

  // standings view is already tie-broken: Pts > GD > GF > Win%
  const [{ data: standings, error: sErr }, { data: rounds }] = await Promise.all([
    admin
      .from("player_standings")
      .select("player_id")
      .eq("season_id", seasonId)
      .limit(6),
    admin
      .from("matches")
      .select("round_no")
      .eq("season_id", seasonId)
      .eq("night_date", night)
      .order("round_no", { ascending: false })
      .limit(1),
  ]);
  if (sErr) throw new Error(sErr.message);

  const fixture = buildCrownMatch(
    (standings ?? []).map((s) => s.player_id!).filter(Boolean),
    (rounds?.[0]?.round_no ?? 0) + 1,
  );
  if (!fixture) throw new Error("Need 6 ranked players for the Crown Match.");

  const { error } = await admin.rpc("create_round", {
    p_season_id: seasonId,
    p_night: night,
    p_fixtures: [fixture] as unknown as never,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/");
}

export async function submitResult(formData: FormData) {
  const admin = supabaseAdmin();
  const result = String(formData.get("result") || "");
  const { error } = await admin.rpc("submit_result", {
    p_match_id: String(formData.get("matchId")),
    p_score_a: Number(formData.get("scoreA") || 0),
    p_score_b: Number(formData.get("scoreB") || 0),
    p_result: (result === "clear" ? null : result) as never,
    p_via_shootout: formData.get("viaShootout") === "true",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/");
}
