-- Let an archived or draft event actually take its feed twin off the site.
--
-- The Events page renders two sources: our own published site_events rows, and
-- the aggregated US-wide EV feed behind /api/events. The two overlap heavily —
-- the 0019 import scraped driveelectricmonth.org, which the feed already
-- aggregates — so Events.tsx drops any feed event whose source id matches one of
-- ours (use-external-events.sourceEventKey, keyed on the registration URL).
--
-- That dedupe reads the VISIBLE events, which is where archiving went wrong.
-- Archive or unpublish an imported event and its row leaves the visible set,
-- its source id leaves the dedupe, and the feed copy it had been suppressing
-- comes straight back. Archiving an imported event did not hide it — it
-- un-hid the twin. Eleven events were live this way.
--
-- The site cannot see those rows to know better: site_events RLS grants anon
-- `status = 'published'` only, which is correct and stays. So this view hands
-- the public site exactly one fact — "a row we are not showing claims this
-- registration URL" — and nothing else. No title, no description, no date, no
-- contact details, nothing about the draft beyond a link that already points at
-- somebody else's public event page.
--
-- Included: every row that is not published (draft, archived, anything added
-- later) and every removal marker (hidden = true), which had the same blind
-- spot — mergeEvents drops hidden rows before the dedupe ever runs.
--
-- A view is used rather than a policy because a policy cannot restrict COLUMNS,
-- only rows. Views run with the definer's rights, so this reads through RLS by
-- design; the projection is the boundary, so keep it to register_url.
--
-- Run in Supabase -> SQL Editor (or `supabase db push`).

drop view if exists public.event_feed_suppressions;

create view public.event_feed_suppressions as
  select register_url
  from public.site_events
  where register_url is not null
    and register_url <> ''
    and (status <> 'published' or hidden);

comment on view public.event_feed_suppressions is
  'Registration URLs claimed by site_events rows the public site does not show (draft, archived, or removal markers). The Events page subtracts these from the external feed so archiving an imported event also removes the feed copy it was hiding. Deliberately projects register_url ONLY — it reads through RLS, and anything else added here would leak unpublished content.';

grant select on public.event_feed_suppressions to anon, authenticated;
