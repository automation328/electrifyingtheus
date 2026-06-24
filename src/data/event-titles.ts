// Per-event display-title registry.
//
// This is the single place to set an exact, human-curated title for an event as
// it appears on the Events page and event cards. It overrides the automatic
// "Title - City" behaviour (see eventDisplayTitle in events.ts), so use it
// whenever the auto-derived city is wrong, missing a state, or the event needs a
// cleaner name than the source feed provides.
//
// IMPORTANT: prefer keying by EVENT ID. The aggregated feed re-titles events
// over time (e.g. a real event name flips back to the generic "National Drive
// Electric Month"), so a title-keyed override silently stops matching. The event
// id (the `eventid=NNNN` in the event's register/source URL) is stable.
//
// ── How to title an event (the recipe) ─────────────────────────────────────
//  1. Open https://test.electrifyingtheus.com/api/events and find the event.
//  2. If its `url` has `eventid=NNNN`, add an entry to TITLE_BY_ID keyed by that
//     number. This is the durable choice and survives feed re-titling.
//  3. If it has no event id (some sources don't), add an entry to TITLE_BY_TITLE
//     keyed by the event's exact current title instead.
//  4. The value is rendered verbatim — include the city/state suffix yourself,
//     e.g. "… - Houston, TX". Keep state codes uppercase (TX, CA, MI).
//  5. No entry for an event? It falls back to automatic "Title - City" from its
//     location; online / address-less events keep their plain title.

/** Event id (from the source `eventid=NNNN`) → exact title to display. */
export const TITLE_BY_ID: Record<string, string> = {
  "5109": "Campbellsville 4th of July Celebration 2026 - Campbellsville, KY",
  "5274": "Ventura's July 4th Street Fair and EV Showcase - Ventura, CA",
  "5267": "Recharge Hopkins EV Petting Zoo at the Raspberry Festival - Hopkins, MN",
  "5287": "Saline Summerfest EV Show - Saline, MI",
  "5298": "Electric Vehicle Showcase at the Vintage Car Show - Highland Park",
  "5289": "Thousand Oaks Rotary Club Street Fair and Electric Vehicle Showcase - Thousand Oaks, CA",
  "5126": "Knoxville Drive Electric Festival - Knoxville, TN",
  "5254": "Ventura County EV Showcase - Ventura, CA",
  "5199": "EV Expo in Madison - Madison, NJ",
  "5306": "Salem Electric Cars & Coffee - Salem, OR",
  "5304": "StoreLocal Napa &ndash; Ride and Drive Electric - Napa, CA",
  "5275": "EV Showcase at the Port of Hueneme Banana Festival - Hueneme, CA",
};

/** Exact base title → display title, for events with no stable id (e.g. feeds
 *  that don't expose an eventid). Use TITLE_BY_ID whenever an id exists. */
export const TITLE_BY_TITLE: Record<string, string> = {
  "JSC EV Club Lunch": "JSC EV Club Lunch - Webster, TX",
  "Brews & Batteries": "Brews & Batteries - Houston, TX",
};

/** Resolve a curated title for an event, or "" if none is registered. */
export const lookupEventTitle = (registerUrl: string | undefined, baseTitle: string): string => {
  const id = registerUrl?.match(/eventid=(\d+)/)?.[1];
  return (id && TITLE_BY_ID[id]) || TITLE_BY_TITLE[baseTitle.trim()] || "";
};
