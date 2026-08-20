-- ─────────────────────────────────────────────────────────────────────────────
-- HEADER IMAGES for every event that has none
--
-- 93 of the 134 real events still fall back to the site's single stock EV
-- photo, so the Events list is 93 identical thumbnails. This deals them the 30
-- ETUS event headers in order, cycling: 1.jpg, 2.jpg … 30.jpg, 1.jpg …
--
-- ORDERED BY event_date, then id. Deterministic, and it means neighbouring
-- events in the list get different headers rather than clumping.
--
-- ONLY TOUCHES image IS NULL. Every event that already carries a real flyer —
-- the Taco flyer, the TEVA photo, Knoxville, Poolesville, and the 41 others —
-- keeps it. That is also what makes this safe to re-run: after the first run
-- nothing matches.
--
-- REQUIRES THE DEPLOY THAT ADDS public/media/events/headers/. Run it before and
-- 93 events point at URLs that 404, so every card shows a broken image instead
-- of the stock fallback — strictly worse than doing nothing.
--
-- NOT the site-media bucket, for the same reason as 0021: uploading there goes
-- through /api/admin behind an editor login. The cost is that these 30 files do
-- not appear in the CMS media library, so swapping one is a commit and a deploy
-- rather than an upload.
--
-- image is not part of any identity — the dedupe and the slug are built from
-- title + date — so this cannot resurrect a built-in event or un-adopt one.
-- hidden = false is there anyway, since a removal marker is not a real event
-- and giving it a picture would be meaningless.
-- ─────────────────────────────────────────────────────────────────────────────

with ranked as (
  select
    id,
    row_number() over (order by event_date, id) - 1 as n
  from public.site_events
  where hidden = false
    and image is null
)
update public.site_events s
set image = 'https://electrifyingtheus.com/media/events/headers/'
            || ((r.n % 30) + 1)::text || '.jpg'
from ranked r
where s.id = r.id;

-- Verify: nothing left on the stock fallback, and the 30 headers used evenly.
select
  count(*) filter (where image is null)                              as still_without,
  count(*) filter (where image like '%/media/events/headers/%')      as on_a_header,
  count(*) filter (where image is not null
                     and image not like '%/media/events/headers/%')  as on_their_own_flyer
from public.site_events
where hidden = false;

-- How many events each header ended up on. Expect 3 or 4 apiece.
select
  split_part(image, '/media/events/headers/', 2) as header,
  count(*)                                       as events
from public.site_events
where hidden = false
  and image like '%/media/events/headers/%'
group by 1
order by (split_part(image, '/media/events/headers/', 2))::text;
