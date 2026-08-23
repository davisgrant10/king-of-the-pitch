-- King of the Pitch: individual-leaderboard 3v3 tournament schema
-- Points live on PLAYERS, never teams. Teams exist only inside a single match.

create table if not exists seasons (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  starts_on   date,
  ends_on     date,
  win_pts     numeric not null default 1,      -- configurable: 1 (Windlands) or 3 (classic)
  draw_pts    numeric not null default 0,
  best_n      int,                             -- count only each player's best N nights (null = all)
  crown_multiplier numeric not null default 2, -- championship-match payout multiplier
  created_at  timestamptz not null default now()
);

create table if not exists players (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  club        text,
  skill       int check (skill between 1 and 5),
  created_at  timestamptz not null default now()
);

create table if not exists season_players (
  season_id   uuid not null references seasons(id) on delete cascade,
  player_id   uuid not null references players(id) on delete cascade,
  primary key (season_id, player_id)
);

create table if not exists rsvps (
  season_id   uuid not null references seasons(id) on delete cascade,
  player_id   uuid not null references players(id) on delete cascade,
  night_date  date not null,
  status      text not null check (status in ('in','out')),
  updated_at  timestamptz not null default now(),
  primary key (season_id, player_id, night_date)
);

create table if not exists matches (
  id          uuid primary key default gen_random_uuid(),
  season_id   uuid not null references seasons(id) on delete cascade,
  night_date  date not null,
  round_no    int  not null,
  pitch_no    int  not null default 1,
  kind        text not null default 'regular' check (kind in ('regular','crown')),
  score_a     int  not null default 0,
  score_b     int  not null default 0,
  result      text check (result in ('a','b','d')),  -- null = not played yet
  via_shootout boolean not null default false,
  played_at   timestamptz
);
create index if not exists idx_matches_season_night on matches (season_id, night_date);

-- who was on which side of which match (the "team" is just these 3 rows)
create table if not exists match_rosters (
  match_id    uuid not null references matches(id) on delete cascade,
  player_id   uuid not null references players(id) on delete cascade,
  side        text not null check (side in ('a','b')),
  primary key (match_id, player_id)
);
create index if not exists idx_rosters_player on match_rosters (player_id);

-- per-player, per-match outcome line (derived, so stats are one query away)
create or replace view player_match_lines as
select
  r.player_id, m.season_id, m.night_date, m.id as match_id, m.kind,
  case when m.result = r.side then 'w'
       when m.result = 'd'   then 'd'
       when m.result is null then null
       else 'l' end as outcome,
  case when r.side = 'a' then m.score_a else m.score_b end as gf,
  case when r.side = 'a' then m.score_b else m.score_a end as ga,
  case when m.result = r.side then s.win_pts * (case when m.kind = 'crown' then s.crown_multiplier else 1 end)
       when m.result = 'd'   then s.draw_pts
       else 0 end as pts
from match_rosters r
join matches m on m.id = r.match_id
join seasons s on s.id = m.season_id
where m.result is not null;

-- points per player per night (the unit "best N" is measured in)
create or replace view player_night_points as
select player_id, season_id, night_date, sum(pts) as night_pts
from player_match_lines
group by player_id, season_id, night_date;

-- full standings: PTS = best N nights, tiebreak columns included
create or replace view player_standings as
with best as (
  select pnp.player_id, pnp.season_id, sum(pnp.night_pts) as pts
  from (
    select p.*, row_number() over (partition by p.player_id, p.season_id order by p.night_pts desc) as rn,
           s.best_n
    from player_night_points p join seasons s on s.id = p.season_id
  ) pnp
  where pnp.best_n is null or pnp.rn <= pnp.best_n
  group by pnp.player_id, pnp.season_id
),
tot as (
  select player_id, season_id,
    count(*)                                as mp,
    count(*) filter (where outcome = 'w')   as w,
    count(*) filter (where outcome = 'd')   as d,
    count(*) filter (where outcome = 'l')   as l,
    sum(gf)                                 as gf,
    sum(ga)                                 as ga,
    sum(gf) - sum(ga)                       as gd,
    sum(pts)                                as all_pts
  from player_match_lines group by player_id, season_id
)
select pl.id as player_id, pl.name, pl.club, t.season_id,
       coalesce(b.pts, 0) as pts, t.all_pts, t.mp, t.w, t.d, t.l, t.gf, t.ga, t.gd,
       round(t.w::numeric / nullif(t.mp, 0), 3) as win_rate
from tot t
join players pl on pl.id = t.player_id
left join best b on b.player_id = t.player_id and b.season_id = t.season_id
order by pts desc, t.gd desc, t.gf desc, win_rate desc, pl.name;

-- row-level security: anyone can read the league, only signed-in users can write
alter table seasons        enable row level security;
alter table players        enable row level security;
alter table season_players enable row level security;
alter table rsvps          enable row level security;
alter table matches        enable row level security;
alter table match_rosters  enable row level security;

do $$
declare t text;
begin
  foreach t in array array['seasons','players','season_players','rsvps','matches','match_rosters'] loop
    execute format('create policy "public read"  on %I for select using (true)', t);
    execute format('create policy "auth insert"  on %I for insert to authenticated with check (true)', t);
    execute format('create policy "auth update"  on %I for update to authenticated using (true)', t);
    execute format('create policy "auth delete"  on %I for delete to authenticated using (true)', t);
  end loop;
end $$;

-- seed: the real season this schema was born for
insert into seasons (name, starts_on, ends_on, win_pts, draw_pts, best_n, crown_multiplier)
values ('Windlands 3v3 Ladder — Fall 2026', '2026-08-29', '2026-10-03', 1, 0, 4, 2);
