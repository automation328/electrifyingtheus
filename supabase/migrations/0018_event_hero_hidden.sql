-- ─────────────────────────────────────────────────────────────────────────────
-- EVENTS — keep an event off the homepage hero carousel
--
-- WHY: HeroSection builds its deck from `events.filter(e => !e.heroHidden)`
-- and takes the FIRST TWO by date (components/HeroSection.tsx). `heroHidden`
-- exists on the curated events in data/events.ts — 23 of the ~25 set it — but
-- site_events had no column for it, so mergeEvents could only inherit the flag
-- for a DB row that overrides a curated event of the same title + date.
--
-- A brand-new DB event therefore arrived hero-eligible with no way to say
-- otherwise, and because the hero picks the two SOONEST events, any event added
-- through the CMS with a near date silently took over the homepage carousel.
-- That was survivable while site_events held a handful of rows. It stops being
-- survivable the moment a bulk import lands (0019 adds 121 third-party events),
-- which would have put other organisations' events on our front page.
--
-- DEFAULT false, so nothing that exists today changes behaviour: every current
-- DB event stays hero-eligible exactly as it is now. The import in 0019 sets
-- the flag explicitly on its own rows.
--
-- Apply by running this in the Supabase SQL editor. Safe to run more than once.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.site_events
  add column if not exists hero_hidden boolean not null default false;

comment on column public.site_events.hero_hidden is
  'true = never show this event in the homepage hero carousel. It still appears in the Events list, the Featured section and the navbar. Mirrors EventItem.heroHidden on the curated events in data/events.ts.';
