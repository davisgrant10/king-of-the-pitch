-- Atomic round creation: all matches + rosters land together or not at all.
-- fixtures: [{"round_no":1,"pitch_no":1,"kind":"regular","a":[uuid,...],"b":[uuid,...]}, ...]
create or replace function create_round(
  p_season_id uuid, p_night date, p_fixtures jsonb
) returns setof uuid
language plpgsql security invoker set search_path = public as $$
declare fx jsonb; m_id uuid; pid text;
begin
  for fx in select * from jsonb_array_elements(p_fixtures) loop
    insert into matches (season_id, night_date, round_no, pitch_no, kind)
    values (p_season_id, p_night, (fx->>'round_no')::int,
            coalesce((fx->>'pitch_no')::int, 1), coalesce(fx->>'kind','regular'))
    returning id into m_id;
    for pid in select jsonb_array_elements_text(fx->'a') loop
      insert into match_rosters (match_id, player_id, side) values (m_id, pid::uuid, 'a');
    end loop;
    for pid in select jsonb_array_elements_text(fx->'b') loop
      insert into match_rosters (match_id, player_id, side) values (m_id, pid::uuid, 'b');
    end loop;
    return next m_id;
  end loop;
end $$;

-- Guarded score submission: one atomic update, result must agree with the score.
create or replace function submit_result(
  p_match_id uuid, p_score_a int, p_score_b int,
  p_result text, p_via_shootout boolean default false
) returns void
language plpgsql security invoker set search_path = public as $$
begin
  if p_result is not null and p_result not in ('a','b','d') then
    raise exception 'result must be a, b, d or null';
  end if;
  if not p_via_shootout and p_result in ('a','b') and p_score_a <> p_score_b then
    if (p_result = 'a') <> (p_score_a > p_score_b) then
      raise exception 'result % contradicts score %-%', p_result, p_score_a, p_score_b;
    end if;
  end if;
  if p_result = 'd' and p_score_a <> p_score_b then
    raise exception 'a draw needs a level score, got %-%', p_score_a, p_score_b;
  end if;
  update matches set score_a = p_score_a, score_b = p_score_b, result = p_result,
    via_shootout = coalesce(p_via_shootout,false),
    played_at = case when p_result is null then null else coalesce(played_at, now()) end
  where id = p_match_id;
  if not found then raise exception 'match % not found', p_match_id; end if;
end $$;
