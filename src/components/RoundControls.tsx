import { generateRound, generateCrownMatch } from "@/app/actions";

/**
 * Round generator controls — a server-action <form>, so it works with zero
 * client-side JavaScript: the button posts to the server, the server runs the
 * matchmaking algorithm, writes the round atomically, and the page re-renders.
 */
export function RoundControls({ seasonId, night }: { seasonId: string; night: string }) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <form action={generateRound} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="seasonId" value={seasonId} />
        <input type="hidden" name="night" value={night} />
        <label className="grid gap-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-stone-500">
          Pitches
          <select
            name="pitches"
            defaultValue="2"
            className="rounded-lg border border-stone-300 px-2 py-2 font-sans text-sm text-stone-900"
          >
            {[1, 2, 3, 4].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-stone-500">
          Team draw
          <select
            name="balance"
            defaultValue="mix"
            className="rounded-lg border border-stone-300 px-2 py-2 font-sans text-sm text-stone-900"
          >
            <option value="mix">Mix everyone</option>
            <option value="skill">Balance by skill</option>
          </select>
        </label>
        <button className="rounded-lg bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-700">
          Draw next round
        </button>
      </form>
      <form action={generateCrownMatch}>
        <input type="hidden" name="seasonId" value={seasonId} />
        <input type="hidden" name="night" value={night} />
        <button className="rounded-lg border border-amber-600 px-4 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-50">
          Draw the Crown Match
        </button>
      </form>
    </div>
  );
}
