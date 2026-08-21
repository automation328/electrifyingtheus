---
name: event-title
description: The event title convention for site_events - "<Title> - <City>, <ST>" - plus the two kinds of row that must never be renamed. Use when adding, importing, bulk-editing or auditing events, or when asked why an event appears twice after a rename.
---

# Event titles

Every **`site_events` row** stores its title as:

```
<Title> - <City>, <ST>
```

`Knoxville Drive Electric Festival - Knoxville, TN`

The city and state come from the row's own `region` column, which is already in
`City, ST` form.

## Why

`/admin/content` lists the **raw stored title**. With 130+ events, `Electric Car
Show` and `Cars & Coffee` are indistinguishable until you read the small grey
subtitle. The suffix makes the list scannable.

## The stored title is what ships

`eventDisplayTitle` (`src/data/events.ts`) returns a row's title **verbatim**
whenever the event has an `id` — and every `site_events` row has one. What you
type in `/admin/content/events` is exactly what a visitor reads. Nothing is
stripped and nothing is appended.

This has changed twice, so be careful reading older code or notes:

* It used to be **stripped** by `eventTitleClean`, so the suffix was invisible
  to visitors. That function is gone.
* It was then **appended to**, which is worse: a title that already ended in
  `- Seattle, WA` came out as `Roadmap Conference - Seattle, WA - WA 98101`.
  Eight live events showed a title the CMS did not hold.

Deriving now happens for the two sources that have no row and arrive with a bare
title: the **aggregated feed** (`/api/events`) and **curated events nobody has
edited yet**. For those, `eventCity` + `eventStateCode` parse the location and
the city is appended. The moment an editor touches such an event it gains a row,
and from then on its stored title is the whole answer.

Practical consequence: **to change how an event reads on the site, edit its
title in the CMS.** Do not reach for the parser or for
`src/data/event-titles.ts` — that registry only reaches events with no row.

## Curated events do NOT follow this

The `EVENTS` array in `src/data/events.ts` keeps clean titles. Those are ETU's
own events, there are ~25 of them, and the city is appended for them at render
time from their `location`. **Do not add city and state to `data/events.ts`** — and see the second
hazard below for why renaming a curated event is worse than pointless.

## Two rows you must never rename

Both hazards come from the same place: `mergeEvents` in `src/lib/content.ts`
matches database rows to curated events on **title + date** (`eventDedupe`).
Change a title and that match silently disappears.

**1. Removal markers — `hidden = true`.** A published row with `hidden = true`
is not an event. It exists to delete the built-in event with the same title and
date (migration `0016`). Rename it and it stops matching, and the built-in event
it was hiding **comes back on the live site**.

**2. Rows that adopt a curated event.** When a row's title + date match an entry
in `data/events.ts`, the row *replaces* it. Rename the row and the curated copy
is appended too — **the event now shows twice**. This is the usual cause of
"why is this event duplicated after I renamed it".

Guard against both by excluding `hidden = true` and every `(title, date)` pair
from `data/events.ts`. Migration `0020_event_title_city_state.sql` does exactly
that and is the worked example.

## Renaming changes the detail-page URL

`fallbackSlug` is `slugify(title)` + the date, so `/events/appleton-drive-electric`
becomes `/events/appleton-drive-electric-appleton-wi`. Internal links derive from
the same function and stay consistent; only a link somebody copied off the site
earlier breaks. Fine for a recent import, a real cost for an established event.

## Audit

Run in the Supabase SQL editor. No local tooling needed.

```sql
-- Rows missing the suffix, with the reason visible in `region`.
select title, region, event_date
from public.site_events
where hidden = false
  and btrim(title) !~ '[[:space:]][-–—][[:space:]]+.+,[[:space:]]*[A-Z]{2}$'
order by event_date;
```

Rows whose `region` is not a `City, ST` pair — `Online`, `Oslo, Norway` — are
**expected** in that list. Do not force a suffix onto them.

Checking whether the migration has been applied, or any other schema question,
without a service-role key: see the `verify-supabase-migration-applied` memory.

## Importing new events

Build the title with the suffix in the INSERT rather than fixing it afterwards:

```sql
v.title || ' - ' || v.region
```

`0019_ndem_2026_events.sql` is the reference importer. Note its header: a re-run
deletes and re-inserts its own rows, so any title an editor hand-edited in the
CMS is discarded. If titles have been curated by hand since the import, do not
re-run it without checking what will be lost.
