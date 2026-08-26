// The events-page search box.
//
// Lives here rather than inline in Events.tsx so it can be tested directly:
// every rule below exists because a specific query returned the wrong thing, and
// the only way to keep them true is to assert them.
//
// ── The one principle ────────────────────────────────────────────────────────
//
// Every branch is a HYPOTHESIS about what the visitor meant. A branch returns
// its result only if it found something; otherwise the next branch gets a turn.
// Nothing here can hand back an empty list while a later branch would have
// matched.
//
// That is not a style preference. The first version of this search committed to
// the state branch unconditionally, so typing "la" resolved to Louisiana, found
// no Louisiana events, and rendered "No events match" over a page that held
// twenty — including the LA Auto Show. Nine queries behaved that way ("la",
// "mo", "ri", "de", "ar", "pr", "pe", "west", "mont"). A search that is CERTAIN
// it understood you is the thing to avoid.

import { eventCity, eventState, parseStateQuery, startsWord, type EventItem } from "@/data/events";
import { zipToState } from "@/lib/zip-to-state";

/** Words in a query, punctuation discarded — the same split startsWord applies
 *  to the text being searched, so the two always agree about what a word is. */
const tokenize = (q: string): string[] => q.split(/[^a-z0-9]+/).filter(Boolean);

/** Everything about an event a visitor might reasonably type. Concatenated
 *  rather than tested field by field: startsWord splits the haystack on
 *  non-alphanumerics anyway, so the word set is identical and this is cheaper. */
const haystack = (e: EventItem): string =>
  `${e.region || ""} ${e.location || ""} ${e.title || ""} ${e.type || ""}`;

const hasWord = (e: EventItem, word: string): boolean => startsWord(haystack(e), word);

const isOnline = (e: EventItem): boolean => /online|webinar|virtual/i.test(e.location || "");

/**
 * Events matching what the visitor typed, best interpretation first.
 *
 * Order: ZIP, online, a state, a "<place> <state>" pair, then plain words.
 */
export function filterEvents(all: EventItem[], query: string): EventItem[] {
  const q = query.trim().toLowerCase().replace(/\s+/g, " ");
  if (!q) return all;

  // ── A ZIP code ────────────────────────────────────────────────────────────
  // The exact ZIP if any event's address carries it, otherwise everything in
  // the state that ZIP belongs to. The placeholder in the search box says
  // "e.g. Atlanta, 30301, or Online" and 30301 used to return nothing at all,
  // because a ZIP only ever matched as a literal substring of an address.
  if (/^\d{5}$/.test(q)) {
    const exact = all.filter((e) => (e.location || "").includes(q));
    if (exact.length) return exact;
    const st = zipToState(q);
    if (st) {
      const inState = all.filter((e) => eventState(e) === st);
      if (inState.length) return inState;
    }
  }

  // ── Online ────────────────────────────────────────────────────────────────
  if (/^(online|virtual|webinar|remote)$/.test(q)) {
    const online = all.filter(isOnline);
    if (online.length) return online;
  }

  // ── A state, by code or name ──────────────────────────────────────────────
  // Answered by the event's own state, never by matching the letters "ca"
  // against "Showcase". The city union is for names that are also city names:
  // "washington" is Washington State, but it is also Washington, DC, and
  // filtering purely by state silently dropped the one DC event on the site.
  const state = parseStateQuery(q);
  if (state) {
    const inState = all.filter((e) => eventState(e) === state || eventCity(e).toLowerCase() === q);
    if (inState.length) return inState;
  }

  const words = tokenize(q);

  // ── "<place> <state>" ─────────────────────────────────────────────────────
  // "denver co", "portland or", "santa maria ca" — how people actually type a
  // place into a search box. Without this the comma is load-bearing and
  // invisible: "denver, co" found four events and "denver co" found none.
  //
  // The split is tried from the right, so the longest trailing state name wins
  // ("kansas city kansas" reads as city "kansas city" + state Kansas).
  if (words.length > 1) {
    for (let i = words.length - 1; i >= 1; i--) {
      const tail = parseStateQuery(words.slice(i).join(" "));
      if (!tail) continue;
      const head = words.slice(0, i);
      const hits = all.filter((e) => eventState(e) === tail && head.every((w) => hasWord(e, w)));
      if (hits.length) return hits;
    }
  }

  // ── Plain words ───────────────────────────────────────────────────────────
  // EVERY word must match somewhere, which is what keeps "san diego" from
  // matching San Jose. Tokenising the query as well as the text is what makes
  // "winston-salem" work: matching the raw string could never succeed, because
  // no word in the text contains a hyphen.
  return all.filter((e) => words.every((w) => hasWord(e, w)));
}
