-- ─────────────────────────────────────────────────────────────────────────────
-- INCENTIVE FRESHNESS — when a program runs, and when we last checked it
--
-- site_incentives is a DIRECTORY, not a rules engine: `amount` is free text
-- ("Up to $12,000", "$1,350 - $2,000") and src/data/incentives.ts tells readers
-- to "always verify on the official program page". That is a defensible product
-- decision, but it makes staleness the whole risk — and today nothing in the
-- row records whether an entry is still true.
--
-- Real programs move constantly. In one recent stretch: Oregon CVRP suspended
-- and reopened behind a hard Aug 25 – Nov 4 window, Delaware stopped accepting
-- purchases made before May 1, and PG&E extended one deadline while changing
-- its eligibility rules outright on Oct 1. A wrong amount on our page currently
-- stays live forever, because nothing marks it as needing a look.
--
-- Four nullable columns, no defaults. NULL keeps every existing row exactly as
-- it reads today — no backfill, nothing to migrate.
--
--   valid_from   first day the program applies
--   valid_to     last day it applies
--   verified_at  the day a person last checked the row against the official page
--   status_note  short public banner, e.g. "Waitlist — funds depleted"
--
-- WHY `date` AND NOT `timestamptz`: these are calendar dates as the program
-- publishes them ("purchased or leased August 25, 2026 through November 4,
-- 2026"), not instants. A timestamp would drift by a timezone and close a
-- rebate a day early for somebody. Matches site_events.event_date/end_date and
-- site_blog_posts.published_at, which are all `date` for the same reason.
--
-- WHY NULL valid_to IS NOT "EXPIRED": most programs have no announced end date.
-- Anything that reads this column must treat NULL as open-ended, never as past.
--
-- WHY status_note IS PUBLIC: it is meant to be shown to visitors beside the
-- amount. It is not a scratchpad — internal remarks do not belong in it.
--
-- No index is added. The table holds tens of rows, so the planner will seq-scan
-- it whatever we do, and an unused index is just something else to maintain.
--
-- RLS is unchanged: "public read published incentives" filters by row (status),
-- so these columns are covered by the existing policy automatically.
--
-- Apply by running this in the Supabase SQL editor. Safe to run more than once.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.site_incentives
  add column if not exists valid_from  date,
  add column if not exists valid_to    date,
  add column if not exists verified_at date,
  add column if not exists status_note text;

comment on column public.site_incentives.valid_from is
  'First day the program applies. NULL = no published start date; do not treat as "not yet open".';

comment on column public.site_incentives.valid_to is
  'Last day the program applies. NULL = open-ended, NOT expired. Only a date in the past means expired.';

comment on column public.site_incentives.verified_at is
  'The day someone last checked this row against the official program page. NULL = never verified since it was added — the stalest state there is.';

comment on column public.site_incentives.status_note is
  'Short public banner shown beside the amount, e.g. "Waitlist — funds depleted" or "Suspended until further notice". Public-facing: no internal notes.';

-- A window that closes before it opens would mark the incentive expired the
-- moment it was saved, so the database refuses it outright. Mirrors
-- site_events_end_after_start in 0012.
alter table public.site_incentives
  drop constraint if exists site_incentives_valid_to_after_from;

alter table public.site_incentives
  add constraint site_incentives_valid_to_after_from
  check (valid_to is null or valid_from is null or valid_to >= valid_from);

-- Deliberately NOT constrained: verified_at <= current_date. CHECK constraints
-- must be immutable, and current_date is not — a row valid at insert would fail
-- a later dump/restore. A future date here is an editor typo, so the CMS field
-- catches it instead.
