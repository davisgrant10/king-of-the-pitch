-- Close the gap 0003 left open on the two RPCs.
--
-- 0003 did:
--   revoke execute on function create_round(...) from anon, authenticated;
--
-- which looked right and reported clean in information_schema.role_routine_grants,
-- but did nothing. Postgres grants EXECUTE on every new function to PUBLIC by
-- default, and anon/authenticated reach the function through that PUBLIC grant
-- rather than through a grant of their own. Revoking a privilege a role never
-- held directly is a silent no-op. The proof is in the ACL:
--
--   create_round(uuid,date,jsonb) -> =X/postgres | postgres=X/postgres | service_role=X/postgres
--                                    ^^^^^^^^^^^ empty grantee == PUBLIC
--
--   has_function_privilege('anon','create_round(uuid,date,jsonb)','EXECUTE') -> true
--
-- Revoke from PUBLIC, which is what actually carries the privilege. service_role
-- holds its own explicit grant (service_role=X/postgres) and so is unaffected;
-- the grants below are belt-and-braces to make that independence explicit rather
-- than incidental.
--
-- Only this app's two functions are named. save_store and touch_updated_at
-- belong to the other application sharing this database and are left alone.

begin;

revoke execute on function create_round(uuid, date, jsonb) from public;
revoke execute on function submit_result(uuid, integer, integer, text, boolean) from public;

grant execute on function create_round(uuid, date, jsonb) to service_role;
grant execute on function submit_result(uuid, integer, integer, text, boolean) to service_role;

commit;

-- Verify with:
--   select has_function_privilege('anon','create_round(uuid,date,jsonb)','EXECUTE');         -- false
--   select has_function_privilege('service_role','create_round(uuid,date,jsonb)','EXECUTE'); -- true
