/**
 * Offline proof the matchmaking algorithm is fair — no database needed.
 * Run: npm run simulate
 *
 * Simulates a 21-player, 3-club season: 5 nights × 4 rounds on 3 pitches,
 * then audits equal playing time, repeat teammates, club mixing, and (in
 * skill mode) team-strength balance.
 */
import { buildRound, buildCrownMatch, type HistoryEntry, type MatchmakingPlayer } from "../src/lib/matchmaking";

const clubs = ["Sonics", "Outlaws", "Rangers"];
const players: MatchmakingPlayer[] = Array.from({ length: 21 }, (_, i) => ({
  id: `p${String(i + 1).padStart(2, "0")}`,
  club: clubs[i % 3],
  skill: (i % 5) + 1,
}));

for (const balance of ["mix", "skill"] as const) {
  const history: HistoryEntry[] = [];
  const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);

  for (let nightIdx = 0; nightIdx < 5; nightIdx++) {
    history.forEach((h) => (h.tonight = false));
    for (let r = 1; r <= 4; r++) {
      const round = buildRound(players, history, { roundNo: r, maxPitches: 3, balance });
      if (!round) throw new Error("round failed");
      for (const f of round.fixtures) history.push({ a: f.a, b: f.b, tonight: true });
    }
  }

  // ---- audit ----
  const together = new Map<string, number>();
  const games = new Map<string, number>();
  let skillGapTotal = 0;
  for (const h of history) {
    for (const side of [h.a, h.b]) {
      for (let i = 0; i < 3; i++) {
        games.set(side[i], (games.get(side[i]) ?? 0) + 1);
        for (let j = i + 1; j < 3; j++) {
          together.set(pairKey(side[i], side[j]), (together.get(pairKey(side[i], side[j])) ?? 0) + 1);
        }
      }
    }
    const sum = (t: string[]) => t.reduce((a, id) => a + (players.find((p) => p.id === id)!.skill ?? 3), 0);
    skillGapTotal += Math.abs(sum(h.a) - sum(h.b));
  }
  const counts = [...games.values()];
  const repeats = [...together.values()];
  const sameClub = [...together.entries()].filter(([k, v]) => {
    const [a, b] = k.split("|");
    return v > 0 && players.find((p) => p.id === a)!.club === players.find((p) => p.id === b)!.club;
  }).length;

  console.log(`\n=== balance: ${balance} — ${history.length} matches over 5 nights ===`);
  console.log(`games per player     min ${Math.min(...counts)}, max ${Math.max(...counts)} (spread ${Math.max(...counts) - Math.min(...counts)})`);
  console.log(`max repeat teammates ${Math.max(...repeats)} (pairs used ${repeats.length} of ${(21 * 20) / 2})`);
  console.log(`same-club pairings   ${sameClub}/${repeats.length} (${((100 * sameClub) / repeats.length).toFixed(1)}% vs ~30% random)`);
  console.log(`avg skill gap/match  ${(skillGapTotal / history.length).toFixed(2)} rating points`);

  const fails: string[] = [];
  if (Math.max(...counts) - Math.min(...counts) > 2) fails.push("uneven playing time");
  if (Math.max(...repeats) > 2) fails.push("teammate pair repeated 3+ times");
  if (balance === "skill" && skillGapTotal / history.length > 1.5) fails.push("skill balance too loose");
  if (fails.length) {
    console.error("FAIL:", fails.join("; "));
    process.exit(1);
  }
  console.log("PASS");
}

// crown match seeding sanity
const crown = buildCrownMatch(["s1", "s2", "s3", "s4", "s5", "s6", "s7"], 5)!;
const ok = JSON.stringify(crown.a) === '["s1","s4","s5"]' && JSON.stringify(crown.b) === '["s2","s3","s6"]';
console.log(`\ncrown snake seed 1-4-5 v 2-3-6: ${ok ? "PASS" : "FAIL"}`);
if (!ok) process.exit(1);
