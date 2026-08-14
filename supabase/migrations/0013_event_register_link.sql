-- ─────────────────────────────────────────────────────────────────────────────
-- EVENT REGISTRATION LINK — editable on the event's own page
--
-- The two "Register" buttons on /events/<slug> had no column behind them. A
-- registration link could only be written into src/data/events.ts and shipped,
-- which meant an event added through the CMS or the submission form could never
-- have one: both buttons fell back to /contact-us. register_url closes that.
--
-- The two labels are separate columns on purpose. The buttons say different
-- things in the two places they appear ("Register" beside the poster, "Register
-- now" in the Save-your-spot band), so one shared label would rewrite the other
-- button the moment an editor touched either. The LINK is deliberately NOT
-- split: an event has one registration page, and two fields that can disagree
-- about it is a bug waiting for someone to hit it.
--
-- All three are nullable with no default: NULL means "unchanged from today" —
-- the page keeps its built-in wording and its /contact-us fallback.
--
-- Apply by running this in the Supabase SQL editor. Safe to run more than once.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.site_events
  add column if not exists register_url text,
  add column if not exists register_label text,
  add column if not exists register_cta_label text;

comment on column public.site_events.register_url is
  'Where both Register buttons send people. NULL/blank = no registration link, and the buttons go to /contact-us instead.';

comment on column public.site_events.register_label is
  'Text on the Register button beside the poster. NULL/blank = "Register".';

comment on column public.site_events.register_cta_label is
  'Text on the Register button in the Save-your-spot band. NULL/blank = "Register now".';
