-- ─────────────────────────────────────────────────────────────────────────────
-- RATE LIMITING — a counter the serverless functions can share
--
-- There is no rate limiting anywhere in api/ today. Every endpoint is unbounded,
-- and /api/lead is the expensive one: each request performs a GoHighLevel
-- upsert, a Supabase insert and a Slack post. A trivial script can burn the
-- Vercel invocation budget, fill the CRM with junk contacts, and flood
-- site_form_submissions — the one table holding real people's personal data.
--
-- WHY POSTGRES AND NOT MEMORY: serverless functions keep no state between
-- invocations, and Vercel runs many instances at once, so an in-process counter
-- would reset constantly and count only a fraction of traffic. Postgres is the
-- only shared thing these functions already have.
--
-- WHY A FIXED WINDOW, NOT A SLIDING ONE: a fixed bucket is a single atomic
-- upsert with no read-modify-write race. A sliding window needs either a row
-- per request or a lock, and neither is worth it here — the failure this guards
-- against is a flood, not someone shaving the edge of a window.
--
-- THE KEY IS A HASH, NEVER AN ADDRESS. api/_rate-limit.ts stores
-- sha256(ip + RATE_LIMIT_SALT), so this table cannot be turned into a log of
-- who visited. Losing the salt makes old rows meaningless, which is the point.
--
-- ACCESS: RLS on with NO policies, like site_analytics (0002) and
-- site_form_submissions (0015) — unreachable with the anon key in either
-- direction. Only the service role can touch it.
--
-- Apply by running this in the Supabase SQL editor. Safe to run more than once.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.site_rate_limit (
  -- sha256(ip + salt) — never the address itself.
  ip_hash     text        not null,
  -- Which limit this counts: "lead", "admin", … so one noisy endpoint cannot
  -- lock a visitor out of the others.
  bucket      text        not null,
  -- Start of the fixed window this row counts, truncated to the window size.
  window_start timestamptz not null,
  hits        integer     not null default 0,
  primary key (ip_hash, bucket, window_start)
);

comment on table public.site_rate_limit is
  'Fixed-window request counters, shared across serverless invocations. Keyed on a salted hash of the IP, never the address. Rows older than a day are dead weight — see the cleanup below.';

-- Old windows are never read again. Cheap to sweep, and keeps the table small
-- enough that the primary key is the only index it will ever need.
create index if not exists site_rate_limit_window_idx
  on public.site_rate_limit (window_start);

alter table public.site_rate_limit enable row level security;

-- One atomic check-and-increment. Returning the new count lets the caller decide
-- the limit, so a single function serves every endpoint's different budget.
--
-- SECURITY DEFINER so it runs as the owner: the table has RLS with no policies,
-- and this is the only sanctioned way in. search_path is pinned because a
-- definer function that resolves names through the caller's path is a classic
-- privilege-escalation route.
create or replace function public.bump_rate_limit(
  p_ip_hash text,
  p_bucket  text,
  p_window  timestamptz
) returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_hits integer;
begin
  insert into public.site_rate_limit (ip_hash, bucket, window_start, hits)
  values (p_ip_hash, p_bucket, p_window, 1)
  on conflict (ip_hash, bucket, window_start)
    do update set hits = public.site_rate_limit.hits + 1
  returning hits into v_hits;

  -- Opportunistic cleanup: roughly one call in a thousand clears yesterday's
  -- windows. No cron needed, and the cost is spread across normal traffic
  -- instead of landing in one scheduled spike.
  if random() < 0.001 then
    delete from public.site_rate_limit where window_start < now() - interval '1 day';
  end if;

  return v_hits;
end;
$$;

comment on function public.bump_rate_limit(text, text, timestamptz) is
  'Atomically increments and returns the hit count for one (ip_hash, bucket, window). The caller owns the threshold. Never receives a raw IP address.';

revoke all on function public.bump_rate_limit(text, text, timestamptz) from public, anon, authenticated;
