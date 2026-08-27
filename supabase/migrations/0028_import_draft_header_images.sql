-- HEADER IMAGES for the drafts the weekly import created with none.
--
-- The first weekly import stored image = null whenever the source page had no
-- photo of its own. The reasoning was that a blank thumbnail flags a draft that
-- still needs a picture. It does not: it just looks broken. The CMS Drafts tab
-- came out as twenty-one rows of empty grey placeholder icons, and every one of
-- those events would have fallen back to the SAME stock photo once published --
-- which is exactly the wall of identical thumbnails migration 0024 existed to
-- get rid of.
--
-- This deals the same 30 ETUS headers to whatever is still imageless, using the
-- same rule as 0024: cycling 1.jpg .. 30.jpg in event_date then id order, so it
-- is deterministic and neighbouring events in the list differ.
--
-- ONLY TOUCHES image IS NULL. Anything carrying a real photo -- a flyer, an
-- uploaded picture, or an og:image the feed supplied -- keeps it. That is also
-- what makes this safe to re-run: after the first run nothing matches.
--
-- Future imports no longer need this. api/_event-import.ts now picks a header
-- itself when the feed gives no photo, seeded by the event's own identity. It
-- uses a hash rather than this ordered cycle, because reproducing FNV-1a in SQL
-- to gain nothing would be silly -- both draw from the same 30 files and both
-- are deterministic.
--
-- The 30 files shipped with 0024, so unlike that migration there is no deploy to
-- wait for here.

with numbered as (
  select
    id,
    (row_number() over (order by event_date, id) - 1) as n
  from public.site_events
  where image is null
)
update public.site_events e
set image = 'https://electrifyingtheus.com/media/events/headers/'
            || ((numbered.n % 30) + 1)::text || '.jpg'
from numbered
where e.id = numbered.id;

-- Should report 0 once this has run.
select count(*) as still_without_an_image
from public.site_events
where image is null;
