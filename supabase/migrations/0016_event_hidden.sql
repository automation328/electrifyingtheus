-- ─────────────────────────────────────────────────────────────────────────────
-- REMOVING A BUILT-IN EVENT — the `hidden` flag, as vehicles and incentives use
--
-- Until now a curated event from src/data/events.ts could be EDITED in the CMS
-- (which adopts it into a site_events row that overrides it) but never REMOVED.
-- mergeEvents (src/lib/content.ts) re-appends every curated event that has no
-- matching published row, so a built-in event always came back.
--
-- And the obvious workaround silently did not work. Adopting an event and then
-- archiving it LOOKS like a delete, but fetchEvents selects only
-- status = 'published', so the archived row drops out of the dynamic set, its
-- key leaves the dedupe, and the curated event reappears on the site. An editor
-- would have every reason to believe they had removed it.
--
-- So removal needs its own signal, and it must ride on a PUBLISHED row: RLS
-- never exposes non-published rows to the site, so a draft or archived
-- "delete" marker would be invisible to the merge and do nothing.
--
-- This is the same mechanism 0006 already established for site_vehicles and
-- site_incentives:
--     a published row with hidden = true REMOVES the matching curated entry,
--     and is not itself displayed.
-- Events match the curated entry on title + date, which is the dedupe key
-- mergeEvents already uses.
--
-- Existing rows default to false, so nothing currently on the site changes.
--
-- Apply by running this in the Supabase SQL editor. Safe to run more than once.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.site_events
  add column if not exists hidden boolean not null default false;

comment on column public.site_events.hidden is
  'Published + hidden = true REMOVES the curated event with the same title and date from the site, and this row is not displayed either. The only way to delete a built-in event. Must be published: RLS hides non-published rows from the site, so a draft marker would do nothing.';

-- The merge reads every published row on each load and checks this flag, so the
-- partial index keeps that lookup cheap as the table grows.
create index if not exists site_events_hidden_idx
  on public.site_events (hidden)
  where hidden = true;
