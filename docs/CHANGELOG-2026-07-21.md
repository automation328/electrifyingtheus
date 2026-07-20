# Changelog — 2026-07-21

Work completed this session. Everything below shipped to production
(electrifyingtheus.com), was verified live, and is committed.
Commit range: `7a0eb1b` → `bba7add`.

---

## Events — location pins

- Added **City, ST map pins** to Meetup/feed events that arrived with no
  location (Austin, Houston, Knoxville) via a tiered `eventLocationPin()`
  (override → location field → Meetup group metro → description parse).
  `2a0f1d2`, `8c9b147`
- Fixed **JSC EV Club Lunch** → pin "League City, TX" (was wrongly "Houston"),
  and stripped a feed-baked "- Webster, TX" from its title. `0a2d52f`

## Gallery — Photos & Videos

- Removed **3 "E-Mobility Fellowship" indoor photos**. `fac2e4d`
- Added the **webinar replay** as a card in the Videos row that **links to the
  replay page** instead of playing inline. `a2e0bf6`
- Fixed the **homepage media rail** so its webinar card also links to the replay
  page rather than opening the lightbox. `4a9b04c`

## "From Pump to Plug" Part 2 webinar

- Swapped the flyer + moved the date twice as new artwork arrived:
  Aug 6 → **Aug 19** (`d0f13b7`) → **Thu Aug 27** (`477cd95`). Each move was
  confirmed against the **Zoom registration** (not just the flyer); caught a
  wrong weekday on the Aug 19 art; de-drifted the event page to derive the
  weekday from the date.
- Added the Part 2 **flyer directly under the "Register for Part 2" button** on
  the replay page (via a reusable `extraCtaImage` prop). `cbf470b`

## Events — EVA calendar "bot"

- Built a **JSON adapter** for the Electric Vehicle Association calendar
  (myeva.org / EventCalendarApp) into the events aggregator. It auto-refreshes
  hourly, **excludes the internal "Chapter Leadership Zoom" calls**, collapses
  recurring meetups to their next date, and de-dupes cross-source overlaps with
  the existing Drive Electric Month feed. Plus one curated event (Green Energy
  Consumers' "Discover EVs in Falmouth"). The other requested sources were
  assessed and skipped: PlugStar / PlugInAmerica duplicate Drive Electric Month,
  DriveCleanColorado blocks server requests (Cloudflare 415), EV Magazine is an
  editorial listicle (403), MissionElectric had no upcoming events. `c001999`
- Verified and delivered the **10 live event detail links**, then opened them in
  the browser.

## DOE / AFDC de-branding (site-wide)

- Removed the **sunset "Alternative Fuel Vehicle Refueling Property Credit"**
  from the incentives data **and EVan's knowledge base**. `84763e7`
- Cleaned the incentives search intro (`149d090`) and the remaining DOE/AFDC on
  the incentives page (`cdfdc93`).
- Ran a **20-file parallel workflow** to de-brand DOE/AFDC across every topic
  page — relabeling source citations to their topic and dropping attribution
  from prose, while **keeping every fact and link**. `2ca4591`
- Scrubbed the remaining DOE/AFDC from **developer code comments + identifiers**;
  confirmed the shipped bundle contains **zero** DOE/AFDC branding. Also found
  Vercel injects the git commit message into the bundle, so later commit
  messages were written free of those tokens. `2c50596`

## EV-vs-Gas calculator

- Moved the assumptions panel **directly under the green savings box**, renamed
  it **"Adjust the data"** (from "Adjust assumptions"), and removed the
  **Charging loss** slider (its default value still applies in the math).
  `bba7add`

## Docs

- Wrote `docs/SHARING-AUTOMATIONS-NOTIFICATIONS.md` (+ a hosted artifact)
  documenting how sharing, CRM/automation, and notifications work end to end.
  `e2a30b1`

---

## Carry-forward notes

1. **The EVA events are a live bot**, not a fixed list — the set rotates as EVA
   updates their calendar and the feed window moves. Past events auto-drop
   (their detail pages 404 afterward). Only the Falmouth event is hardcoded.
   To make any specific event permanent, promote it into the static events list.
2. **EVan's knowledge-base edit is in the repo only.** The live EVan agent runs
   on the n8n instance and won't reflect the change until the updated system
   prompt (`n8n/EVA-system-prompt.md`) is pasted into the agent node there.
