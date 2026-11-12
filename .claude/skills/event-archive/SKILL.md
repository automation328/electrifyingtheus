---
name: event-archive
description: How events that have already happened are archived on electrifyingtheus.com - the daily sweep, the CMS Archive tab, what is never archived, and the Claude Code hook that flags past dates. Use when adding, importing, restoring or auditing events, when an event "disappeared", or when asked to archive past events.
---

# Archiving past events

An event is **past** once its last day (`end_date`, else `event_date`) is
before **today in Honolulu** (`Pacific/Honolulu`, the westernmost US zone), so
nothing is retired while it is still on anywhere in the country.

## What happens to a past event

| Layer | Behaviour | Where |
|-------|-----------|-------|
| Public site | Hidden everywhere (home hero, Events, navbar, detail page) unless the event is `ours: true`. | `useEvents` → `isActive` in `src/data/events.ts` |
| CMS list | Filed under **Archive**, published or draft, as soon as it is past. | `tabOf` in `src/components/admin/CollectionManager.tsx` |
| Database | Daily at 11:00 UTC the cron sets `status = 'archived'` on past `draft` **and** `published` rows. | `archivePastEvents` in `api/_event-import.ts`, cron `/api/cron/archive-past-events` → `/api/admin?op=archive-past-events` (`vercel.json`) |

Archived rows are kept, not deleted: an editor can restore one from the
Archive tab (it comes back as a draft), and the weekly import still sees it,
so it does not re-add the same event.

## Never archived

- **Removal markers**: published rows with `hidden = true`. They take a
  built-in event off the site; archiving one would bring the built-in back.
  The sweep filters `hidden not.is.true`.
- **Curated (built-in) events** in `src/data/events.ts` have no row to
  archive. They drop off the site by date through `isActive`.

## Watch out

- If a row **adopts** a curated event (same slug) and that curated event is
  `ours: true`, archiving the row lets the original built-in back onto the
  site. No curated event is `ours` today. If you add `ours: true` to one, make
  the sweep skip its slug (see the `shortcut:` comment on `archivePastEvents`).
- To keep one of our own past events visible, set `ours: true` on the curated
  entry. A database row has no `ours` flag.
- Run the sweep by hand: `GET /api/cron/archive-past-events` with
  `Authorization: Bearer $CRON_SECRET`. It returns `{ today, archived, rows }`.

## Claude Code hook

`.claude/settings.json` runs `scripts/claude-hooks/past-event-warn.mjs` after
every Edit/Write. When the edit touches `src/data/events.ts` or a
`supabase/migrations/*.sql` file mentioning `site_events`, and adds an event
whose last day is already over, it tells Claude so it can check the date with
the user. It never blocks an edit. Self-test:

```
node scripts/claude-hooks/past-event-warn.mjs --self-test
```
