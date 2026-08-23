/**
 * Offline proof the matchmaking algorithm is fair — no database needed.
 * Run: npm run simulate
 *
 * Simulates a 21-player, 3-club season (5 nights × 4 rounds on 3 pitches) in
 * both draw modes, then audits playing time, repeat teammates, club mixing and
 * team balance.
 *
 * The run is SEEDED. A fairness proof that reports something different every
 * time proves nothing you can act on: a bad result could be a real regression
 * or just an unlucky shuffle, and you cannot tell which. Fixed seeds make a
 * failure reproducible and a pass meaningful. Several seeds are used so the
 * result still reflects a spread of draws rather than one lucky one.
 */
import {
  buildRound,
  buildCrownMatch,
  type HistoryEntry,
  type MatchmakingPlayer,
} from "../src/lib/matchmaking";

/** mulberry32 — small deterministic PRNG, so every run audits the same seasons. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEEDS = [1, 2, 3, 4, 5];
const CLUBS = ["Sonics", "Outlaws", "Rangers"];
const players: MatchmakingPlayer[] = Array.from({ length: 21 }, (_, i) => ({
  id: `p${String(i + 1).padStart(2, "0")}`,
  club: CLUBS[i % 3],
  skill: (i % 5) + 1,
}));
const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
const skillOf = (id: string) => players.find((p) => p.id === id)!.skill ?? 3;

interface Audit {
  matches: number;
  playSpread: number;
  maxRepeat: number;
  repeatFloor: number;
  pairsUsed: number;
  sameClubPct: number;
  avgSkillGap: number;
}

function season(balance: "mix" | "skill", seed: number): Audit {
  const rng = seeded(seed);
  const history: HistoryEntry[] = [];
  for (let night = 0; night < 5; night++) {
    history.forEach((h) => (h.tonight = false));
    for (let r = 1; r <= 4; r++) {
      const round = buildRound(players, history, {
        roundNo: r,
        maxPitches: 3,
        balance,
        rng,
      });
      if (!round) throw new Error("round generation failed");
      for (const f of round.fixtures) history.push({ a: f.a, b: f.b, tonight: true });
    }
  }

  const together = new Map<string, number>();
  const games = new Map<string, number>();
  let skillGap = 0;
  for (const h of history) {
    for (const side of [h.a, h.b]) {
      for (let i = 0; i < 3; i++) {
        games.set(side[i], (games.get(side[i]) ?? 0) + 1);
        for (let j = i + 1; j < 3; j++) {
          const k = pairKey(side[i], side[j]);
          together.set(k, (together.get(k) ?? 0) + 1);
        }
      }
    }
    const sum = (t: string[]) => t.reduce((a, id) => a + skillOf(id), 0);
    skillGap += Math.abs(sum(h.a) - sum(h.b));
  }

  const counts = [...games.values()];
  const repeats = [...together.values()];

  // Count same-club PAIRINGS, not distinct same-club pairs. Over a season long
  // enough to use every pair at least once, the distinct-pair share is pinned at
  // whatever fraction of all possible pairs share a club (30% here) no matter how
  // well the draw mixes — it measures the roster, not the algorithm. Weighting by
  // how often each pair actually played together is what moves.
  let sameClubPairings = 0;
  let allPairings = 0;
  for (const [k, v] of together) {
    const [a, b] = k.split("|");
    allPairings += v;
    if (players.find((p) => p.id === a)!.club === players.find((p) => p.id === b)!.club)
      sameClubPairings += v;
  }

  // With more pairings than available pairs, some repetition is unavoidable.
  // This is the best any algorithm could do — the bar worth measuring against.
  const totalPairings = history.length * 6;
  const possiblePairs = (players.length * (players.length - 1)) / 2;

  return {
    matches: history.length,
    playSpread: Math.max(...counts) - Math.min(...counts),
    maxRepeat: Math.max(...repeats),
    repeatFloor: Math.ceil(totalPairings / possiblePairs),
    pairsUsed: repeats.length,
    sameClubPct: (100 * sameClubPairings) / allPairings,
    avgSkillGap: skillGap / history.length,
  };
}

let failed = false;
for (const balance of ["mix", "skill"] as const) {
  const runs = SEEDS.map((s) => season(balance, s));
  const worst = <K extends keyof Audit>(k: K) => Math.max(...runs.map((r) => r[k] as number));
  const mean = <K extends keyof Audit>(k: K) =>
    runs.reduce((a, r) => a + (r[k] as number), 0) / runs.length;

  console.log(`\n=== balance: ${balance} — ${SEEDS.length} seasons of ${runs[0].matches} matches ===`);
  console.log(`games per player     spread ${worst("playSpread")} (worst seed)`);
  console.log(
    `repeat teammates     max ${worst("maxRepeat")}, unavoidable floor ${runs[0].repeatFloor} · ` +
      `${mean("pairsUsed").toFixed(0)}/210 pairs used`,
  );
  console.log(`same-club pairings   ${mean("sameClubPct").toFixed(1)}% (random baseline ~30%)`);
  console.log(`avg skill gap/match  ${mean("avgSkillGap").toFixed(2)} rating points`);

  const fails: string[] = [];
  // Equal playing time: at most one game between the busiest and quietest player.
  if (worst("playSpread") > 1) fails.push(`playing time spread ${worst("playSpread")} > 1`);
  // Freshness: never worse than the mathematically unavoidable amount of repetition.
  if (worst("maxRepeat") > runs[0].repeatFloor)
    fails.push(`max repeat ${worst("maxRepeat")} exceeds the unavoidable floor ${runs[0].repeatFloor}`);
  // Mixing must beat chance, not merely match it.
  if (mean("sameClubPct") > 28)
    fails.push(`club mixing ${mean("sameClubPct").toFixed(1)}% no better than random`);
  // Balance mode has to actually balance — and must not do it by spending freshness.
  if (balance === "skill" && mean("avgSkillGap") > 2)
    fails.push(`skill balance too loose (${mean("avgSkillGap").toFixed(2)})`);
  if (balance === "mix" && mean("avgSkillGap") < 2)
    fails.push("mix mode is balancing by skill when it should not");

  if (fails.length) {
    console.error("FAIL: " + fails.join("; "));
    failed = true;
  } else {
    console.log("PASS");
  }
}

const crown = buildCrownMatch(["s1", "s2", "s3", "s4", "s5", "s6", "s7"], 5)!;
const crownOk =
  JSON.stringify(crown.a) === '["s1","s4","s5"]' && JSON.stringify(crown.b) === '["s2","s3","s6"]';
console.log(`\ncrown snake seed 1-4-5 v 2-3-6: ${crownOk ? "PASS" : "FAIL"}`);
if (!crownOk || failed) process.exit(1);
