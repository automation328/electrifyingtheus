-- ─────────────────────────────────────────────────────────────────────────────
-- MULTI-DAY EVENTS — an optional end date
--
-- Some events run for weeks (National Drive Electric Month, Sep 11 – Oct 12).
-- Until now site_events held a single event_date, so a span could only be
-- described in the free-text `time` column, and the event dropped off the
-- listing the day after it opened.
--
-- event_date keeps its exact meaning: it is the START of the event, the sort
-- key, and half of the (title + event_date) dedupe key that decides an event's
-- detail-page slug. It must not move, so the span is a NEW nullable column
-- rather than a change to the existing one. NULL end_date = single-day event,
-- which is every row that exists today.
--
-- Apply by running this in the Supabase SQL editor. Safe to run more than once.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.site_events
  add column if not exists end_date date;

comment on column public.site_events.end_date is
  'Last day of a multi-day event. NULL for a single-day event. Never part of the slug.';

-- A range that ends before it starts would hide the event from the listing the
-- moment it was saved, so the database refuses it outright.
alter table public.site_events
  drop constraint if exists site_events_end_after_start;

alter table public.site_events
  add constraint site_events_end_after_start
  check (end_date is null or end_date >= event_date);
