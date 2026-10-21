-- Lock record_gate_login() to the server.
--
-- The function is SECURITY DEFINER and was granted to anon, whose key ships in
-- the production JavaScript bundle. Anyone could call it with made-up emails and
-- IPs: filling gate_logins with junk rows, inflating "distinct IPs" so the
-- shared-login Slack alert cries wolf, and growing the table with unbounded
-- user-agent strings.
--
-- api/gate-login.ts now calls it with the service-role key, so execute is revoked
-- from public, anon and authenticated and granted to service_role only. The user
-- agent is also capped at 512 characters inside the function.
--
-- Apply in the Supabase SQL editor. Safe to re-run. Deploy order does not matter:
-- the code works before this runs (service role can always call the function)
-- and after it.

create or replace function record_gate_login(p_email text, p_ip text, p_ua text)
returns table (is_new_ip boolean, distinct_ips int)
language plpgsql
security definer
set search_path = public
as $$
begin
  select not exists (select 1 from gate_logins where email = p_email and ip = p_ip)
    into is_new_ip;

  insert into gate_logins (email, ip, user_agent)
  values (p_email, p_ip, left(p_ua, 512))
  on conflict (email, ip) do update
    set last_seen  = now(),
        hits       = gate_logins.hits + 1,
        user_agent = excluded.user_agent;

  select count(distinct ip) into distinct_ips from gate_logins where email = p_email;

  return next;
end;
$$;

revoke execute on function record_gate_login(text, text, text) from public, anon, authenticated;
grant execute on function record_gate_login(text, text, text) to service_role;
