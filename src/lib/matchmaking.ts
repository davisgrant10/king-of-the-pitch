/**
 * Fair-play matchmaking for individual-leaderboard 3v3.
 *
 * The same algorithm that runs the live Windlands tracker, as a pure,
 * dependency-free TypeScript module: give it the active players and the
 * season's match history, get back balanced 3v3 fixtures.
 *
 * Three fairness goals, in priority order:
 *   1. Equal playing time  — players with the fewest matches tonight play first.
 *   2. Fresh teammates     — repeat pairings cost n²·10 + n, so a 2nd pairing
 *                            (cost 22) is tolerable, a 3rd (93) nearly never happens.
 *   3. Mixing / balance    — same-club teammates cost a little (4); in "skill"
 *                            mode uneven team strength costs 6 per rating point.
 *
 * Deterministic tests can inject their own `rng`; production uses Math.random.
 */

export interface MatchmakingPlayer {
  id: string;
  club?: string | null;
  skill?: number | null; // 1..5, unrated counts as 3
}

export interface HistoryEntry {
  /** player ids on side A / side B of a past match */
  a: string[];
  b: string[];
  /** true when the match happened tonight (drives equal-playing-time) */
  tonight?: boolean;
}

export interface Fixture {
  round_no: number;
  pitch_no: number;
  kind: "regular" | "crown";
  a: string[];
  b: string[];
}

export interface RoundResult {
  fixtures: Fixture[];
  bench: string[]; // players sitting this round (fewest-played get priority next time)
}

export interface Options {
  roundNo: number;
  maxPitches?: number; // simultaneous fields available (default 2)
  balance?: "mix" | "skill"; // "mix" = random+fresh, "skill" = also equalize ratings
  restarts?: number; // optimizer restarts (default 40)
  rng?: () => number;
}

const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

function shuffled<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildRound(
  players: MatchmakingPlayer[],
  history: HistoryEntry[],
  opts: Options,
): RoundResult | null {
  const rng = opts.rng ?? Math.random;
  const maxPitches = opts.maxPitches ?? 2;
  const pool = players.map((p) => p.id);
  if (pool.length < 6 || maxPitches < 1) return null;

  const byId = new Map(players.map((p) => [p.id, p]));
  const clubOf = (id: string) => (byId.get(id)?.club ?? "").trim().toLowerCase();
  const skillOf = (id: string) => byId.get(id)?.skill || 3;
  const balancing = opts.balance === "skill";

  // ---- digest history: teammate counts, opponent counts, tonight's load ----
  const together = new Map<string, number>();
  const against = new Map<string, number>();
  const load = new Map<string, number>(pool.map((id) => [id, 0])); // tonight
  const career = new Map<string, number>(pool.map((id) => [id, 0])); // all time
  const bump = (m: Map<string, number>, a: string, b: string) =>
    m.set(pairKey(a, b), (m.get(pairKey(a, b)) ?? 0) + 1);

  for (const h of history) {
    for (const side of [h.a, h.b] as const) {
      for (let i = 0; i < side.length; i++) {
        for (let j = i + 1; j < side.length; j++) bump(together, side[i], side[j]);
      }
    }
    for (const x of h.a) for (const y of h.b) bump(against, x, y);
    for (const id of [...h.a, ...h.b]) {
      if (career.has(id)) career.set(id, (career.get(id) ?? 0) + 1);
      if (h.tonight && load.has(id)) load.set(id, (load.get(id) ?? 0) + 1);
    }
  }

  // ---- equal playing time: fewest-played tonight first, then fewest all
  // season (so who sits out doesn't quietly favor the same players each week) ----
  const pitches = Math.max(1, Math.min(maxPitches, Math.floor(pool.length / 6)));
  const need = pitches * 6;
  const chosen = shuffled(pool, rng)
    .sort(
      (x, y) =>
        (load.get(x) ?? 0) - (load.get(y) ?? 0) ||
        (career.get(x) ?? 0) - (career.get(y) ?? 0),
    )
    .slice(0, need);
  const bench = pool.filter((id) => !chosen.includes(id));

  // ---- team optimizer: random restarts + greedy pairwise swaps ----
  const T = need / 3;
  const cost = (teams: string[][]) => {
    let c = 0;
    for (const t of teams) {
      for (let i = 0; i < 3; i++) {
        for (let j = i + 1; j < 3; j++) {
          const n = together.get(pairKey(t[i], t[j])) ?? 0;
          c += n * n * 10 + n; // repeat-teammate penalty (dominant)
          const ca = clubOf(t[i]);
          if (ca && ca === clubOf(t[j])) c += 4; // same-club nudge (never beats a repeat)
        }
      }
    }
    if (balancing) {
      const sums = teams.map((t) => t.reduce((a, id) => a + skillOf(id), 0));
      const mean = sums.reduce((a, b) => a + b, 0) / sums.length;
      c += sums.reduce((a, v) => a + Math.abs(v - mean), 0) * 6;
    }
    return c;
  };

  let best: { teams: string[][]; c: number } | null = null;
  const restarts = opts.restarts ?? 40;
  for (let r = 0; r < restarts; r++) {
    const flat = shuffled(chosen, rng);
    const teams: string[][] = [];
    for (let i = 0; i < T; i++) teams.push(flat.slice(i * 3, i * 3 + 3));
    let c = cost(teams);
    let moved = true;
    let guard = 0;
    while (moved && guard++ < 60) {
      moved = false;
      for (let t1 = 0; t1 < T; t1++) {
        for (let t2 = t1 + 1; t2 < T; t2++) {
          for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
              [teams[t1][i], teams[t2][j]] = [teams[t2][j], teams[t1][i]];
              const nc = cost(teams);
              if (nc < c) {
                c = nc;
                moved = true;
              } else {
                [teams[t1][i], teams[t2][j]] = [teams[t2][j], teams[t1][i]];
              }
            }
          }
        }
      }
    }
    if (!best || c < best.c) best = { teams: teams.map((t) => t.slice()), c };
    if (best.c === 0) break;
  }

  // ---- pair teams into fixtures, preferring fresh (and even) opposition ----
  const oppCost = (t1: string[], t2: string[]) => {
    let c = 0;
    for (const x of t1) for (const y of t2) c += against.get(pairKey(x, y)) ?? 0;
    if (balancing) {
      const sum = (t: string[]) => t.reduce((a, id) => a + skillOf(id), 0);
      c += Math.abs(sum(t1) - sum(t2)) * 3;
    }
    return c;
  };

  const queue = best!.teams.slice();
  const fixtures: Fixture[] = [];
  let pitch = 1;
  while (queue.length >= 2) {
    const home = queue.shift()!;
    let bi = 0;
    let bc = Infinity;
    queue.forEach((t, i) => {
      const c = oppCost(home, t);
      if (c < bc) {
        bc = c;
        bi = i;
      }
    });
    fixtures.push({
      round_no: opts.roundNo,
      pitch_no: pitch++,
      kind: "regular",
      a: home,
      b: queue.splice(bi, 1)[0],
    });
  }
  return { fixtures, bench };
}

/**
 * Championship fixture: top 6 by standings, snake-seeded 1-4-5 v 2-3-6
 * so the final is a contest rather than a coronation.
 */
export function buildCrownMatch(
  rankedPlayerIds: string[], // best first, already tie-broken
  roundNo: number,
): Fixture | null {
  if (rankedPlayerIds.length < 6) return null;
  const s = rankedPlayerIds.slice(0, 6);
  return {
    round_no: roundNo,
    pitch_no: 1,
    kind: "crown",
    a: [s[0], s[3], s[4]],
    b: [s[1], s[2], s[5]],
  };
}
