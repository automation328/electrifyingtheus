-- ============================================================================
-- Per-individual sign-in tracking for the pre-launch password gate
-- (test.electrifyingtheus.com). Run once in the Supabase SQL editor
-- (Dashboard -> SQL -> New query -> Run).
--
-- Each reviewer has their own email+password (see GATE_USERS env). This logs
-- WHICH person signed in from WHICH IP so we can spot a shared login (the same
-- account showing up from many different IPs).
--
-- The table is NOT directly readable/writable with the public anon key (RLS on,
-- no policies). Writes happen only through record_gate_login(), a SECURITY
-- DEFINER function the gate API calls — it returns whether the IP is new for
-- that account and how many distinct IPs the account has used so far.
-- ============================================================================

-- Recreate cleanly (these are throwaway pre-launch access logs).
drop function if exists record_gate_login(text, text, text);
drop function if exists record_gate_login(text, text);          -- old single-arg signature
drop table if exists gate_logins;

create table gate_logins (
  id          bigserial primary key,
  email       text not null,
  ip          text not null,
  user_agent  text,
  first_seen  timestamptz default now(),
  last_seen   timestamptz default now(),
  hits        int default 1,
  unique (email, ip)
);

create index gate_logins_email_idx on gate_logins (email);

alter table gate_logins enable row level security;
-- (no policies on purpose — direct anon access is denied; only the
--  SECURITY DEFINER function below can touch the table.)

-- Records a successful sign-in for (email, ip). Returns:
--   is_new_ip    TRUE if this account has never signed in from this IP before
--   distinct_ips how many distinct IPs this account has used (sharing signal)
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
  values (p_email, p_ip, p_ua)
  on conflict (email, ip) do update
    set last_seen  = now(),
        hits       = gate_logins.hits + 1,
        user_agent = excluded.user_agent;

  select count(distinct ip) into distinct_ips from gate_logins where email = p_email;

  return next;
end;
$$;

-- The site's anon role may CALL the function (but still cannot read the table).
grant execute on function record_gate_login(text, text, text) to anon;
