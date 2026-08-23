import type { Standing } from "@/lib/supabase/database.types";

/**
 * Live Individual Standings — rows arrive already ranked by the
 * player_standings view (Pts > GD > GF > Win%), so this stays a plain
 * server component: no client JS, no re-sorting, just render.
 */
export function StandingsTable({ rows, bestN }: { rows: Standing[]; bestN: number | null }) {
  if (!rows.length) {
    return (
      <p className="rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-500">
        Standings appear after the first result.
      </p>
    );
  }
  const top = rows[0]?.pts ?? 0;
  return (
    <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
      <table className="w-full text-sm [font-variant-numeric:tabular-nums]">
        <thead>
          <tr className="border-b border-stone-200 font-mono text-[10px] uppercase tracking-widest text-stone-500">
            <th className="px-3 py-2 text-left">#</th>
            <th className="px-3 py-2 text-left">Player</th>
            <th className="px-3 py-2 text-right">Pts</th>
            <th className="px-3 py-2 text-right">All</th>
            <th className="px-3 py-2 text-right">MP</th>
            <th className="px-3 py-2 text-right">W-D-L</th>
            <th className="px-3 py-2 text-right">GF</th>
            <th className="px-3 py-2 text-right">GA</th>
            <th className="px-3 py-2 text-right">GD</th>
            <th className="px-3 py-2 text-right">Win%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const lead = r.pts === top && top > 0;
            return (
              <tr key={r.player_id} className="border-b border-stone-100 last:border-0">
                <td className={`px-3 py-2.5 font-black ${lead ? "text-amber-600" : "text-stone-400"}`}>{i + 1}</td>
                <td className="px-3 py-2.5 font-semibold">
                  {r.name}
                  {lead && <span className="ml-1.5 align-super text-[9px] text-amber-600">◆</span>}
                  {r.club && <span className="ml-2 text-xs font-normal text-stone-400">{r.club}</span>}
                </td>
                <td className={`px-3 py-2.5 text-right text-base font-black ${lead ? "text-amber-600" : ""}`}>{r.pts}</td>
                <td className="px-3 py-2.5 text-right text-stone-400">{r.all_pts}</td>
                <td className="px-3 py-2.5 text-right">{r.mp}</td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right">{r.w}-{r.d}-{r.l}</td>
                <td className="px-3 py-2.5 text-right">{r.gf}</td>
                <td className="px-3 py-2.5 text-right">{r.ga}</td>
                <td className={`px-3 py-2.5 text-right ${(r.gd ?? 0) > 0 ? "text-emerald-700" : ""}`}>
                  {(r.gd ?? 0) > 0 ? "+" : ""}
                  {r.gd}
                </td>
                <td className="px-3 py-2.5 text-right">{r.win_rate == null ? "—" : `${Math.round(Number(r.win_rate) * 100)}%`}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="border-t border-stone-100 px-4 py-2.5 text-xs text-stone-500">
        Pts counts each player&apos;s best {bestN ?? "—"} nights; All is every point earned. Ties break Pts → GD → GF → Win%.
      </p>
    </div>
  );
}
