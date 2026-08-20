-- ─────────────────────────────────────────────────────────────────────────────
-- EVENT TITLES — append " - City, ST" so the CMS list is scannable
--
-- The /admin/content events list shows the RAW stored title. With ~134 events
-- in the table, "Electric Car Show" and "Cars & Coffee" are indistinguishable
-- until you read the small grey subtitle underneath. Several titles were
-- already edited by hand to carry the city and state; this finishes the job.
--
-- SAFE ON THE PUBLIC SITE: eventTitleClean (data/events.ts) deliberately STRIPS
-- a trailing " - City, ST" before rendering an event card, so the venue appears
-- only in the location pin. Adding the suffix changes the CMS list and nothing
-- a visitor sees.
--
-- IT DOES CHANGE THE DETAIL-PAGE URL. The slug is slugify(title) + the date, so
-- /events/appleton-drive-electric becomes
-- /events/appleton-drive-electric-appleton-wi. Internal links are derived from
-- the same function and stay consistent; only a link somebody copied out of the
-- site before today would break. These events are days old, so that is a real
-- but small cost — and the reason this is not worth doing to older events.
--
-- ── TWO SETS THIS MUST NOT TOUCH ─────────────────────────────────────────────
--
-- 1. REMOVAL MARKERS (hidden = true). A published row with hidden = true is not
--    an event: it exists to delete the built-in event with the SAME TITLE AND
--    DATE (migration 0016, mergeEvents in lib/content.ts). Rename one and it
--    stops matching, and the built-in event it was hiding comes back.
--
-- 2. ROWS THAT ADOPT A BUILT-IN EVENT. When a row's title + date match a
--    curated event in data/events.ts, the row REPLACES it. Rename the row and
--    the match breaks, so the curated copy is appended too and the event shows
--    twice. The excluded pairs below are every curated event, so this holds
--    even after someone adopts a different one.
--
-- Also skipped: rows whose title already ends in " - Something, ST", and rows
-- whose region is not a "City, ST" pair — "Online" and "Oslo, Norway" are both
-- present and neither should be appended.
--
-- ── HOW TO RUN ───────────────────────────────────────────────────────────────
--
-- Run the WHOLE FILE in one go. curated_keys is a TEMPORARY table, so it lives
-- only for one execution — running the preview on its own and the UPDATE after
-- would leave the UPDATE with no exclusion list, and it would rename the rows
-- that must not be renamed.
--
-- The Supabase editor shows only the LAST result set, which here is the
-- verification. To preview instead, select and run just the block from
-- `create temporary table` down to the end of STEP 1 — those are contiguous, so
-- the temp table and the preview execute together.
-- ─────────────────────────────────────────────────────────────────────────────

-- Every curated event in src/data/events.ts, as (title, date). Rows matching
-- one of these are adopting it and must keep their title.
create temporary table curated_keys (title text, event_date date);
insert into curated_keys (title, event_date) values
    ('Multi-Modal eMobility Summit', '2026-07-29'),
    ('Demo Days Los Angeles', '2026-06-27'),
    ('Part 2: From The Pump To The Plug - How Electric Vehicles Can Save You Thousands', '2026-08-27'),
    ('MOVE America 2026', '2026-09-23'),
    ('The Battery Show North America 2026', '2026-10-12'),
    ('LA Auto Show / AutoMobility LA 2026', '2026-11-20'),
    ('EV Charging Summit & Expo 2027', '2027-03-01'),
    ('Nordic EV Summit 2027', '2027-05-12'),
    ('Advanced Clean Transportation (ACT) Expo 2027', '2027-05-17'),
    ('IAA Mobility 2027', '2027-09-07'),
    ('Auto Shanghai 2027', '2027-04-23'),
    ('5th Annual Unity Fest 2026', '2026-07-26'),
    ('July Coalition Conversation', '2026-07-30'),
    ('State of Charge 2026: Education, Innovation, and EV Conversions', '2026-07-31'),
    ('EV Charging Meet-Up', '2026-08-06'),
    ('August Coalition Conversation', '2026-08-27'),
    ('Fleet Charging and Meet-Up', '2026-09-09'),
    ('Forth Roadmap Conference', '2026-09-13'),
    ('SoCo Charging Meet-Up', '2026-09-17'),
    ('September Coalition Conversation', '2026-09-24'),
    ('Drive Clean Summit + Expo 2026', '2026-10-22'),
    ('October Coalition Conversation', '2026-10-29'),
    ('Ask an EV Owner (EVADC)', '2026-08-05'),
    ('EVADC Picnic', '2026-08-08'),
    ('EVADC Monthly Meeting', '2026-08-19')
;

-- ── STEP 1: PREVIEW. Run this on its own and read it before the UPDATE. ──────
select
  s.title                                   as before,
  btrim(s.title) || ' - ' || btrim(s.region) as after,
  s.event_date
from public.site_events s
where s.hidden = false
  -- region must be a real "City, ST" pair. Excludes 'Online' and 'Oslo, Norway'.
  and btrim(s.region) ~ '^[^,]+,[[:space:]]*[A-Z]{2}$'
  -- skip anything that already ends in " - Something, ST" (hand-edited earlier)
  and btrim(s.title) !~ '[[:space:]][-–—][[:space:]]+.+,[[:space:]]*[A-Z]{2}$'
  -- skip rows adopting a built-in event
  and not exists (
    select 1 from curated_keys c
    where c.title = s.title and c.event_date = s.event_date
  )
order by s.event_date, s.title;

-- ── STEP 2: THE UPDATE. Same WHERE clause, verbatim. ────────────────────────
update public.site_events s
set title = btrim(s.title) || ' - ' || btrim(s.region)
where s.hidden = false
  and btrim(s.region) ~ '^[^,]+,[[:space:]]*[A-Z]{2}$'
  and btrim(s.title) !~ '[[:space:]][-–—][[:space:]]+.+,[[:space:]]*[A-Z]{2}$'
  and not exists (
    select 1 from curated_keys c
    where c.title = s.title and c.event_date = s.event_date
  );

-- ── STEP 3: TIDY. One imported title carries a trailing space. ──────────────
update public.site_events
set title = btrim(title)
where title <> btrim(title) and hidden = false;

-- ── STEP 4: VERIFY. ─────────────────────────────────────────────────────────
select
  count(*) filter (where hidden = false)                                as real_events,
  count(*) filter (where hidden = false
    and btrim(title) ~ '[[:space:]][-–—][[:space:]]+.+,[[:space:]]*[A-Z]{2}$') as with_city_state,
  count(*) filter (where hidden = false
    and btrim(title) !~ '[[:space:]][-–—][[:space:]]+.+,[[:space:]]*[A-Z]{2}$') as without,
  count(*) filter (where hidden = true)                                 as removal_markers_untouched
from public.site_events;

-- Anything still without the suffix, and why. Expect only rows whose region is
-- not a "City, ST" pair, plus the one adopted curated event.
select title, region, event_date
from public.site_events
where hidden = false
  and btrim(title) !~ '[[:space:]][-–—][[:space:]]+.+,[[:space:]]*[A-Z]{2}$'
order by event_date;
