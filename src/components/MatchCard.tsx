"use client";

import { useState, useTransition } from "react";
import { submitResult } from "@/app/actions";

interface Roster {
  player_id: string;
  side: string;
  players: { name: string } | null;
}
interface MatchWithRoster {
  id: string;
  kind: string;
  round_no: number;
  pitch_no: number;
  score_a: number;
  score_b: number;
  result: string | null;
  via_shootout: boolean;
  match_rosters: Roster[];
}

/**
 * Quick Score Logger — the one component the coach touches all night.
 * Tap +/− as goals happen, tap the winning side (or Draw / Shootout) at the
 * whistle; a server action commits it and the standings re-render.
 */
export function MatchCard({ match, winPts }: { match: MatchWithRoster; winPts: number }) {
  const [scoreA, setScoreA] = useState(match.score_a);
  const [scoreB, setScoreB] = useState(match.score_b);
  const [pending, start] = useTransition();
  const decided = !!match.result;
  const crown = match.kind === "crown";

  const names = (side: string) =>
    match.match_rosters
      .filter((r) => r.side === side)
      .map((r) => r.players?.name ?? "?")
      .join(" · ");

  const send = (result: string, viaShootout = false) =>
    start(async () => {
      const fd = new FormData();
      fd.set("matchId", match.id);
      fd.set("scoreA", String(scoreA));
      fd.set("scoreB", String(scoreB));
      fd.set("result", result);
      fd.set("viaShootout", String(viaShootout));
      await submitResult(fd);
    });

  const sideRow = (side: "a" | "b") => {
    const won = match.result === side;
    const lost = decided && match.result !== side && match.result !== "d";
    return (
      <button
        disabled={decided || pending}
        onClick={() => send(side)}
        className={`flex w-full items-center justify-between px-4 py-3 text-left transition
          ${won ? "bg-emerald-50" : ""} ${lost ? "opacity-50" : ""}
          ${!decided ? "hover:bg-stone-50" : ""}`}
      >
        <span>
          <span className={`block font-mono text-[10px] font-bold uppercase tracking-widest ${won ? "text-emerald-700" : "text-stone-400"}`}>
            Side {side.toUpperCase()}
          </span>
          <span className="font-semibold">{names(side)}</span>
        </span>
        {won && (
          <span className="font-mono text-xs font-bold text-emerald-700">
            +{winPts * (crown ? 2 : 1)}
            {match.via_shootout ? " SO" : ""}
          </span>
        )}
      </button>
    );
  };

  const stepper = (side: "a" | "b") => {
    const [val, set] = side === "a" ? [scoreA, setScoreA] : [scoreB, setScoreB];
    return (
      <div className="inline-flex items-center overflow-hidden rounded-lg border border-stone-300">
        <span className="px-2 font-mono text-[10px] font-bold uppercase text-stone-400">{side}</span>
        <button onClick={() => set(Math.max(0, val - 1))} className="h-9 w-9 hover:bg-stone-100">−</button>
        <b className="w-8 border-x border-stone-200 text-center font-mono text-sm leading-9">{val}</b>
        <button onClick={() => set(val + 1)} className="h-9 w-9 hover:bg-stone-100">+</button>
      </div>
    );
  };

  return (
    <article
      className={`overflow-hidden rounded-xl border bg-white shadow-sm ${crown ? "border-amber-400" : "border-stone-200"}`}
    >
      <header className={`flex items-center justify-between border-b px-4 py-2 ${crown ? "border-amber-200 bg-amber-50" : "border-stone-200 bg-stone-50"}`}>
        <span className={`font-mono text-[10px] font-bold uppercase tracking-widest ${crown ? "text-amber-700" : "text-stone-500"}`}>
          {crown ? "The Crown Match" : `Round ${match.round_no} · Pitch ${match.pitch_no}`}
        </span>
        {decided ? (
          <button onClick={() => send("clear")} disabled={pending} className="text-xs font-semibold text-stone-500 hover:text-stone-900">
            Change
          </button>
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-widest text-stone-400">Tap the winner</span>
        )}
      </header>
      {sideRow("a")}
      <div className="flex items-center gap-2 px-4 font-mono text-xs text-stone-400">
        <span className="h-px flex-1 bg-stone-200" />
        {scoreA + scoreB > 0 || decided ? `${decided ? match.score_a : scoreA} — ${decided ? match.score_b : scoreB}` : "v"}
        <span className="h-px flex-1 bg-stone-200" />
      </div>
      {sideRow("b")}
      {!decided && (
        <footer className="flex flex-wrap items-center gap-2 border-t border-stone-200 px-4 py-2.5">
          {stepper("a")}
          {stepper("b")}
          <button
            onClick={() => send(scoreA > scoreB ? "a" : "b", true)}
            disabled={pending}
            className="rounded-lg border border-stone-300 px-3 py-2 text-xs font-semibold hover:border-stone-500"
            title="Record the leader as a shootout winner"
          >
            Shootout win
          </button>
          <button
            onClick={() => send("d")}
            disabled={pending || scoreA !== scoreB}
            className="rounded-lg border border-stone-300 px-3 py-2 text-xs font-semibold hover:border-stone-500 disabled:opacity-40"
          >
            Draw
          </button>
        </footer>
      )}
    </article>
  );
}
