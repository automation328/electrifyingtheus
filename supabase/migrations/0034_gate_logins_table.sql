-- gate_logins: per-reviewer sign-in log for the pre-launch password gate.
--
-- Until now this table only existed in supabase/gate-logins.sql, a script run
-- by hand, so a database rebuilt from migrations/ would have no table (and no
-- RLS on it). This brings it into the migration history.
--
-- Safe to re-run and safe on the live database, where the table already exists:
-- everything is "if not exists", nothing is dropped, and no rows are touched.
-- The record_gate_login() function and its grants live in 0033 (plpgsql does
-- not check the table at create time, so 0033 running first is fine).

create table if not exists gate_logins (
  id          bigserial primary key,
  email       text not null,
  ip          text not null,
  user_agent  text,
  first_seen  timestamptz default now(),
  last_seen   timestamptz default now(),
  hits        int default 1,
  unique (email, ip)
);

create index if not exists gate_logins_email_idx on gate_logins (email);

-- RLS on with no policies: the anon and authenticated keys cannot read or write
-- it. Only record_gate_login() (SECURITY DEFINER, service_role only) touches it.
alter table gate_logins enable row level security;
