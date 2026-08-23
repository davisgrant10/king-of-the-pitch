-- Tighten Row Level Security.
--
-- 0001 shipped blanket write policies:
--
--   create policy "auth insert" on <table> for insert to authenticated with check (true)
--   (and the matching update/delete)
--
-- Nothing in the app relies on them. Every write goes through a Next.js server
-- action using the service-role client (src/lib/supabase/server.ts), and the
-- service role bypasses RLS altogether. What the policies do is hand any user
-- who signs up to this Supabase project unrestricted insert/update/delete on
-- all six tables -- reachable straight over PostgREST with the publishable key,
-- no app code involved. Drop them.
--
-- Reads are unchanged for every table the app actually reads.
--
-- Scope note: this database is shared with another application (scan_store,
-- save_store). Every statement below names this app's own objects explicitly
-- so nothing here touches the other one.

begin;

-- 1. Remove the blanket write policies.
do $$
declare t text;
begin
  foreach t in array array['seasons','players','season_players','rsvps','matches','match_rosters'] loop
    execute format('drop policy if exists "auth insert" on %I', t);
    execute format('drop policy if exists "auth update" on %I', t);
    execute format('drop policy if exists "auth delete" on %I', t);
  end loop;
end $$;

-- 2. rsvps is not read anywhere in the app -- it appears only in the generated
--    database.types.ts -- so it does not need to be world-readable. RLS stays
--    enabled with no policy at all, which denies anon and authenticated
--    everything. The service-role client still bypasses RLS and can use it
--    freely, so adding an RSVP feature later needs no migration, just a policy
--    if you want to read it with the publishable key.
drop policy if exists "public read" on rsvps;

-- 3. Pin security_invoker on the reporting views. Without it a view runs with
--    its owner's rights and returns rows regardless of the caller's policies --
--    an RLS bypass hiding behind a view. The live database already has this set
--    (Supabase's default for new views), but 0001 never stated it, so a rebuild
--    from these migrations alone would not reproduce it. Idempotent.
--    Every table these views touch (match_rosters, matches, seasons, players)
--    keeps its "public read" policy, so anon reads still work.
alter view player_match_lines  set (security_invoker = on);
alter view player_night_points set (security_invoker = on);
alter view player_standings    set (security_invoker = on);

-- 4. Defence in depth. Supabase grants anon and authenticated full table
--    privileges by default and leans on RLS alone to hold the line. Take the
--    write grants away so a policy added carelessly later cannot reopen writes
--    on its own. Named tables only -- deliberately not "all tables in schema
--    public", which would also strip the other application's table.
--    service_role is untouched.
revoke insert, update, delete, truncate
  on seasons, players, season_players, rsvps, matches, match_rosters
  from anon, authenticated;

-- 5. create_round and submit_result are `security invoker` and, like every
--    function in the public schema, callable over PostgREST by anyone holding
--    the publishable key. Only the server should ever call them. (After step 1
--    they would fail on the underlying writes anyway; this makes the intent
--    explicit and the failure immediate.)
revoke execute on function create_round(uuid, date, jsonb)
  from anon, authenticated;
revoke execute on function submit_result(uuid, integer, integer, text, boolean)
  from anon, authenticated;

commit;

-- Resulting posture for this app's objects
--   anon / authenticated : SELECT on seasons, players, season_players,
--                          matches, match_rosters. Nothing else. No writes,
--                          no rsvps, no RPC.
--   service_role         : unrestricted, bypasses RLS. Server actions only.
