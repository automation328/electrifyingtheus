-- ─────────────────────────────────────────────────────────────────────────────
-- EVENT THUMBNAILS — real flyers and photos for four imported events
--
-- The 0019 import left image null on every row on purpose: rowToEvent falls
-- back to the site's stock EV photo, and a wrong flyer is worse than none.
-- These four now have the real thing.
--
-- WHERE THE FILES LIVE: public/media/events/ in this repo, served straight off
-- the CDN. NOT the site-media bucket, because uploading there goes through
-- /api/admin behind an editor login. The consequence is worth knowing: these
-- three images do NOT appear in the CMS media library, so replacing one is a
-- commit and a deploy rather than an upload. Anything uploaded through the
-- Image field on /admin/content behaves normally and is unaffected by this.
--
-- REQUIRES THE DEPLOY THAT ADDS THOSE FILES. Run this after it, or the rows
-- point at URLs that 404 and every card shows a broken image instead of the
-- stock fallback — which is worse than where they started.
--
-- MATCHED ON register_url, NOT ON TITLE. Titles get edited (0020 appended the
-- city and state to all of them, and several were rewritten by hand before
-- that). The driveelectricmonth eventid in register_url is stable, and is the
-- same key .claude/skills/event-title and the Events-page dedupe use.
--
-- Safe to run more than once.
-- ─────────────────────────────────────────────────────────────────────────────

update public.site_events
set image = 'https://electrifyingtheus.com/media/events/knoxville-drive-electric-festival-2026.jpg'
where register_url = 'https://driveelectricmonth.org/event?eventid=5126';

update public.site_events
set image = 'https://electrifyingtheus.com/media/events/teva-nc-light-electric-repair-workshop.jpg'
where register_url = 'https://driveelectricmonth.org/event?eventid=5410';

-- Both Taco events share one flyer: the flyer itself advertises both dates,
-- "Sept. 21 – Great Bend" and "Oct. 12 – Scott City".
update public.site_events
set image = 'https://electrifyingtheus.com/media/events/lets-taco-bout-evs-2026.png'
where register_url in (
  'https://driveelectricmonth.org/event?eventid=5417',  -- Great Bend, KS  21 Sep
  'https://driveelectricmonth.org/event?eventid=5422'   -- Scott City, KS  12 Oct
);

-- Verify: four rows, each with a real URL, and the right one.
select
  event_date,
  title,
  split_part(image, '/media/events/', 2) as file
from public.site_events
where register_url in (
  'https://driveelectricmonth.org/event?eventid=5126',
  'https://driveelectricmonth.org/event?eventid=5410',
  'https://driveelectricmonth.org/event?eventid=5417',
  'https://driveelectricmonth.org/event?eventid=5422'
)
order by event_date;
