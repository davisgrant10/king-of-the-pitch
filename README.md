# King of the Pitch

A control room for an individual-leaderboard 3v3 soccer tournament: players are
shuffled into new 3-player teams every match, points land on **players** (never
teams), and the season crowns one individual champion.

Built against the schema already deployed to your Supabase project
(**SCAN Scout**) — the season, scoring rules, and standings all live in the
database; this app is a thin, honest window onto it.

## What's inside

| Piece | Where | What it does |
|---|---|---|
| Matchmaking algorithm | `src/lib/matchmaking.ts` | Pure TypeScript. Equal playing time → fresh teammates → club mixing / skill balance. No dependencies, fully testable offline. |
| Database schema | `supabase/migrations/0001_schema.sql` | Tables (`seasons`, `players`, `season_players`, `rsvps`, `matches`, `match_rosters`) + views. **Already applied** to your project. |
| Atomic writes | `supabase/migrations/0002_rpc.sql` | `create_round` (all matches+rosters commit together) and `submit_result` (guarded single update: a result that contradicts the score is rejected). **Already applied.** |
| Standings | `player_standings` view (SQL) | The whole leaderboard — best-N-nights points, MP/W/D/L/GF/GA/GD, tiebreaks Pts → GD → GF → Win% — computed in one query. The app never does standings math. |
| Write API | `src/app/actions.ts` | Next.js server actions: generate round, generate Crown Match, submit result. Run server-side with the secret key; the browser never touches it. |
| Dashboard | `src/app/page.tsx` + `src/components/` | Active-match controller, quick score logger (+/− goals, tap the winner), live standings table. |
| Fairness proof | `scripts/simulate.ts` | Simulates a 21-player season and audits playing time, repeats, mixing, and balance. |

## Run it

You need [Node.js](https://nodejs.org) 20+ installed. Then, in this folder:

```bash
# 1. install dependencies
npm install

# 2. prove the matchmaking is fair (no database needed)
npm run simulate

# 3. configure secrets
cp .env.local.example .env.local
#    open .env.local and paste your service-role key
#    (Supabase dashboard → your project → Project Settings → API keys)

# 4. run it
npm run dev
#    open http://localhost:3000
```

Add players to the season with SQL (Supabase dashboard → SQL editor):

```sql
with s as (select id from seasons limit 1),
p as (insert into players (name, club, skill) values
  ('Marco','Outlaws',4), ('Dee','SuperSonics',3), ('Cruz',null,2),
  ('Ana','SuperSonics',5), ('Tobi',null,3), ('Rey','Outlaws',1)
  returning id)
insert into season_players (season_id, player_id) select s.id, p.id from s, p;
```

Then hit **Draw next round** on the dashboard.

## Deploying

Push this folder to GitHub and import it on [Vercel](https://vercel.com) (free
tier is fine). Set the three environment variables from `.env.local` in the
Vercel project settings. That's the whole deploy.

## Architecture notes (the "why")

- **Points on players, not teams.** A "team" is just three `match_rosters` rows
  that share a match and a side. Nothing else exists, so nothing else can drift.
- **Standings as a SQL view.** One definition of the truth, versioned in a
  migration. The app, a future mobile app, and a spreadsheet export all read the
  same numbers.
- **Server actions over API routes.** The browser posts intent; the server
  holds the secret key and calls a transactional Postgres function. Row Level
  Security keeps the public key read-only, so sharing the dashboard URL can
  never corrupt data.
- **Head-to-head is deliberately not a tiebreaker.** With teams reshuffling
  every match, two players meet on many different team combinations — H2H has
  no stable meaning in this format. The chain is Pts → GD → GF → Win%.
- **The algorithm is a pure function.** `buildRound(players, history, options)`
  → fixtures. Same code path for the dashboard and the simulator, no hidden
  state, easy to unit test.
