-- ============================================================================
-- Password-gate IP tracking for test.electrifyingtheus.com.
-- Run once in the Supabase SQL editor (Dashboard -> SQL -> New query -> Run).
--
-- Stores every IP that has signed in through the site password gate. The table
-- is NOT directly readable/writable with the public anon key (RLS on, no
-- policies). Writes happen only through record_gate_login(), a SECURITY DEFINER
-- function the gate API calls — so the anon key can record a login and learn
-- whether the IP is new, but can never read the full IP log.
-- ============================================================================

create table if not exists gate_logins (
  ip          text primary key,
  email       text,
  first_seen  timestamptz default now(),
  last_seen   timestamptz default now(),
  hits        int         default 1,
  user_agent  text
);
-- If the table already existed without it, add the email column.
alter table gate_logins add column if not exists email text;

alter table gate_logins enable row level security;
-- (no policies on purpose — direct anon access is denied; only the
--  SECURITY DEFINER function below can touch the table.)

-- Records a successful gate sign-in. Returns TRUE when this IP is brand new
-- (first time it has ever signed in), FALSE when it is a returning IP.
create or replace function record_gate_login(p_ip text, p_ua text, p_email text default null)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  is_new boolean;
begin
  select not exists (select 1 from gate_logins where ip = p_ip) into is_new;

  insert into gate_logins (ip, email, user_agent)
  values (p_ip, p_email, p_ua)
  on conflict (ip) do update
    set last_seen   = now(),
        hits        = gate_logins.hits + 1,
        email       = excluded.email,
        user_agent  = excluded.user_agent;

  return is_new;
end;
$$;

-- The site's anon role may CALL the function (but still cannot read the table).
grant execute on function record_gate_login(text, text, text) to anon;
