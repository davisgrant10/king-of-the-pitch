import { supabaseRead } from "@/lib/supabase/server";
import { StandingsTable } from "@/components/StandingsTable";
import { RoundControls } from "@/components/RoundControls";
import { MatchCard } from "@/components/MatchCard";

export const dynamic = "force-dynamic"; // live scoreboard: always render fresh

export default async function Dashboard() {
  // 1. the season (first one; extend to a picker when you run several)
  const { data: seasons, error: seasonErr } = await supabaseRead
    .from("seasons")
    .select("*")
    .order("created_at")
    .limit(1);
  if (seasonErr) throw new Error(seasonErr.message);
  const season = seasons?.[0];
  if (!season) {
    return <p className="text-stone-500">No season found — insert one into the seasons table.</p>;
  }

  const today = new Date().toISOString().slice(0, 10);
  const night = season.starts_on && today < season.starts_on ? season.starts_on : today;

  // 2. tonight's matches (+ who's on each side), standings, roster size — in parallel
  const [{ data: matches }, { data: standings }, { count: playerCount }] = await Promise.all([
    supabaseRead
      .from("matches")
      .select("*, match_rosters(player_id, side, players(name))")
      .eq("season_id", season.id)
      .eq("night_date", night)
      .order("round_no")
      .order("pitch_no"),
    supabaseRead.from("player_standings").select("*").eq("season_id", season.id),
    supabaseRead
      .from("season_players")
      .select("*", { count: "exact", head: true })
      .eq("season_id", season.id),
  ]);

  const open = (matches ?? []).filter((m) => !m.result);
  const done = (matches ?? []).filter((m) => m.result);

  return (
    <main className="grid gap-8">
      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-xl font-black uppercase tracking-tight">Tonight — {night}</h2>
          <span className="font-mono text-xs text-stone-500">
            {playerCount ?? 0} in squad · {done.length} played
          </span>
        </div>
        <RoundControls seasonId={season.id} night={night} />
        <div className="mt-4 grid gap-4">
          {open.map((m) => (
            <MatchCard key={m.id} match={m} winPts={season.win_pts} />
          ))}
          {done.map((m) => (
            <MatchCard key={m.id} match={m} winPts={season.win_pts} />
          ))}
          {!matches?.length && (
            <p className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
              No matches yet tonight — draw a round above.
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xl font-black uppercase tracking-tight">Standings</h2>
        <StandingsTable rows={standings ?? []} bestN={season.best_n} />
      </section>
    </main>
  );
}
