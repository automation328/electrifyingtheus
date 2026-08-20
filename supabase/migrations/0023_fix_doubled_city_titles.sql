-- ─────────────────────────────────────────────────────────────────────────────
-- Titles that name their city twice
--
--   TCS Drive Electric Month EV Showcase - Sewell - Sewell, NJ
--   TCS Drive Electric Month 2026 EV Showcase - Pitman - Pitman, NJ
--   energz EV Expo - Banning - Banning, CA
--
-- 0020 appended " - City, ST" to anything that did not already end in
-- " - Something, ST". These three ended in a BARE city with no state, so they
-- did not match the skip and got the suffix anyway.
--
-- Cosmetic only: eventTitleClean strips the last " - City, ST" before rendering
-- a card, so a visitor sees "…EV Showcase - Sewell" either way. This is for the
-- /admin/content list.
--
-- ── WHY A BACKREFERENCE AND NOT A LIST OF THREE ids ─────────────────────────
--
-- The pattern ' - (X) - \1, ST' only fires when the SAME text appears in both
-- slots, so it cannot touch a title that legitimately carries two dashes:
--
--   Electric Ave - Sustainability Fair & EV Car Show - Winter Park, FL
--   Evolve KY - Norton Commons EV Event - Louisville, KY
--
-- Both were checked against this regex and neither matches. No curated title
-- matches it either, so a rename cannot break a removal marker or un-adopt a
-- built-in event — the two hazards in .claude/skills/event-title. hidden = false
-- is belt and braces.
--
-- 0019 has been corrected in the same commit: the three source titles no longer
-- carry the bare city, so a re-import produces the right thing rather than
-- recreating this.
--
-- Safe to run more than once — after the first run nothing matches.
-- ─────────────────────────────────────────────────────────────────────────────

-- Preview. Run this block on its own first if you want to see the change.
select
  title as before,
  regexp_replace(btrim(title), ' - ([^,]+) - \1, ([A-Z]{2})$', ' - \1, \2') as after
from public.site_events
where hidden = false
  and btrim(title) ~ ' - ([^,]+) - \1, [A-Z]{2}$'
order by event_date;

update public.site_events
set title = regexp_replace(btrim(title), ' - ([^,]+) - \1, ([A-Z]{2})$', ' - \1, \2')
where hidden = false
  and btrim(title) ~ ' - ([^,]+) - \1, [A-Z]{2}$';

-- Verify: zero rows left with a repeated city, and the two legitimate
-- two-dash titles untouched.
select
  count(*) filter (where btrim(title) ~ ' - ([^,]+) - \1, [A-Z]{2}$')      as still_doubled,
  count(*) filter (where btrim(title) ~ ' - [^,]+ - [^,]+, [A-Z]{2}$')     as two_dash_titles
from public.site_events
where hidden = false;
