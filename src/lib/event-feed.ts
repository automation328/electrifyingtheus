// Composing the Events list out of our own events and the aggregated feed.
//
// Extracted from Events.tsx so the dedupe has tests. It is the part of that page
// most likely to be quietly wrong: it decides what NOT to show, so a mistake
// leaves no trace on screen beyond an event that should not be there.

import { isUpcoming, byDateAsc, type EventItem } from "@/data/events";
import { sourceEventKey } from "@/hooks/use-external-events";

/**
 * Our own events first (soonest first), then the feed events we do not already
 * hold ourselves (soonest first). Feed events that have already run are dropped;
 * `etu` is passed in already filtered, because our own events outlive their date.
 *
 * Drop feed events we already hold ourselves. The /api/events feed aggregates
 * driveelectricmonth.org, and so did the 0019 import — 57 events arrive from
 * both directions, and concatenating rendered every one of them twice. Ours
 * wins: a site_events row carries the full venue address, local start and end
 * times and a longer description, where the feed has only what the ICS entry
 * held. The 57th is Poolesville, where "ours" is a hand-authored row with an
 * uploaded flyer — the feed copy has neither.
 *
 * A feed event with no recognisable source id is KEPT. We cannot prove it is a
 * duplicate, and dropping it on a guess loses a real event.
 *
 * `suppressed` is the missing half of that set: the registration URLs of rows
 * the site does NOT show — drafts, archived rows, removal markers (0030). They
 * matter because the dedupe used to be built from the visible events alone, so
 * archiving an imported event took its suppression away with it and the feed
 * copy it had been hiding came straight back. Archiving un-hid the twin instead
 * of hiding it, and eleven events were live that way.
 */
export function mergeFeedEvents(
  etu: EventItem[],
  external: EventItem[],
  suppressed: string[] = [],
): EventItem[] {
  const mine = new Set(
    [...etu.map((e) => e.registerUrl), ...suppressed]
      .map((u) => sourceEventKey(u))
      .filter((k): k is string => !!k),
  );
  const ext = external
    .filter((e) => {
      const k = sourceEventKey(e.registerUrl);
      return isUpcoming(e) && !(k && mine.has(k));
    })
    .sort(byDateAsc);
  return [...etu, ...ext];
}
