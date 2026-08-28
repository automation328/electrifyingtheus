// Multi-day events.
//
// An event used to be a single day. National Drive Electric Month runs from
// September 11 to October 12, and under the old rule it vanished from the
// listing on September 12 — the day after it opened. These tests pin the three
// things that had to change (how long an event counts as upcoming, how the span
// reads, and what lands in a calendar) and the one thing that must NOT change:
// the start date alone still decides an event's identity and its URL.

import { describe, it, expect, afterEach, vi } from "vitest";
import {
  eventEndDate, eventLastDay, isUpcoming, isActive, eventDateRange, eventFullDate,
  gcalLink, eventDate, shortZone, eventCity, eventStateCode, eventDisplayTitle,
  eventState, parseStateQuery, startsWord, EVENTS,
  type EventItem,
} from "@/data/events";

const BASE: EventItem = {
  month: "SEP", day: "11", year: 2026,
  title: "National Drive Electric Month", type: "Campaign",
  location: "Nationwide", region: "Nationwide",
  time: "All month", description: "Drive electric.", image: "/e.jpg",
};

/** The event in the screenshot: September 11 → October 12, 2026. */
const SPAN: EventItem = { ...BASE, endDate: "2026-10-12" };

const at = (y: number, m: number, d: number) => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(y, m - 1, d, 9, 0, 0));
};
afterEach(() => { vi.useRealTimers(); });

describe("reading an event's end date", () => {
  it("is absent for a single-day event", () => {
    expect(eventEndDate(BASE)).toBeNull();
    expect(eventLastDay(BASE).getTime()).toBe(eventDate(BASE).getTime());
  });

  it("parses the stored ISO end date", () => {
    const end = eventEndDate(SPAN)!;
    expect(end.getFullYear()).toBe(2026);
    expect(end.getMonth()).toBe(9); // October
    expect(end.getDate()).toBe(12);
  });

  it("accepts an end on the same day as the start", () => {
    expect(eventEndDate({ ...BASE, endDate: "2026-09-11" })).not.toBeNull();
  });

  it("ignores an end that falls BEFORE the start", () => {
    // Trusting it would mark the event finished the instant it was saved.
    expect(eventEndDate({ ...BASE, endDate: "2026-09-01" })).toBeNull();
  });

  it("ignores an unparseable end date", () => {
    expect(eventEndDate({ ...BASE, endDate: "not-a-date" })).toBeNull();
  });
});

describe("how long an event stays listed", () => {
  it("keeps a month-long event listed while it is running", () => {
    // The bug this feature exists to fix.
    at(2026, 9, 30);
    expect(isUpcoming(SPAN)).toBe(true);
  });

  it("still lists it on its final day", () => {
    at(2026, 10, 12);
    expect(isUpcoming(SPAN)).toBe(true);
  });

  it("drops it the day after it ends", () => {
    at(2026, 10, 13);
    expect(isUpcoming(SPAN)).toBe(false);
  });

  it("would have dropped it the day after it started, without an end date", () => {
    at(2026, 9, 12);
    expect(isUpcoming(BASE)).toBe(false);
    expect(isUpcoming(SPAN)).toBe(true);
  });

  it("leaves single-day events behaving exactly as before", () => {
    at(2026, 9, 11);
    expect(isUpcoming(BASE)).toBe(true);
    at(2026, 9, 12);
    expect(isUpcoming(BASE)).toBe(false);
  });

  it("still keeps our own past events on the site", () => {
    at(2026, 10, 13);
    expect(isActive({ ...SPAN, ours: true })).toBe(true);
    expect(isActive(SPAN)).toBe(false);
  });
});

describe("how the span reads", () => {
  it("says nothing for a single-day event", () => {
    expect(eventDateRange(BASE)).toBe("");
  });

  it("spells out a span across two months", () => {
    expect(eventDateRange(SPAN)).toBe("SEP 11 – OCT 12, 2026");
  });

  it("names the month once when the span stays inside it", () => {
    expect(eventDateRange({ ...BASE, endDate: "2026-09-20" })).toBe("SEP 11 – 20, 2026");
  });

  it("prints both years when the span crosses into a new one", () => {
    const nye: EventItem = { ...BASE, month: "DEC", day: "28", year: 2026, endDate: "2027-01-03" };
    expect(eventDateRange(nye)).toBe("DEC 28, 2026 – JAN 03, 2027");
  });
});

describe("the date line on the event page", () => {
  it("keeps the weekday for a single-day event", () => {
    // 11 September 2026 is a Friday.
    expect(eventFullDate(BASE)).toBe("Friday, SEP 11, 2026");
  });

  it("shows the span instead for a multi-day event", () => {
    // A weekday name means nothing for something running a month.
    expect(eventFullDate(SPAN)).toBe("SEP 11 – OCT 12, 2026");
  });
});

describe("adding an event to Google Calendar", () => {
  const dates = (e: EventItem) =>
    new URLSearchParams(gcalLink(e).split("?")[1]).get("dates");

  it("books a single-day event as one day", () => {
    // Google treats the end of an all-day event as exclusive.
    expect(dates(BASE)).toBe("20260911/20260912");
  });

  it("books a multi-day event across its whole span", () => {
    expect(dates(SPAN)).toBe("20260911/20261013");
  });

  it("rolls over the end of a month instead of inventing day 32", () => {
    // The old code did Number(day) + 1, so the 31st produced "20260832".
    const last = { ...BASE, month: "AUG", day: "31" };
    expect(dates(last)).toBe("20260831/20260901");
  });

  it("rolls over the end of a year", () => {
    const nye = { ...BASE, month: "DEC", day: "31" };
    expect(dates(nye)).toBe("20261231/20270101");
  });
});

describe("two-letter timezone abbreviations (shortZone)", () => {
  // Event times come from three places — curated entries, the CMS and the
  // external feed — and each carries whatever the organiser typed, so one
  // listing read "10:00 am MST" beside another reading "10:00 am MT" for the
  // same hour.
  it("collapses both daylight and standard forms to the same two letters", () => {
    expect(shortZone("3:00 - 7:30 pm EDT")).toBe("3:00 - 7:30 pm ET");
    expect(shortZone("3:00 - 7:30 pm EST")).toBe("3:00 - 7:30 pm ET");
    expect(shortZone("9:00 am - 1:00 pm MST")).toBe("9:00 am - 1:00 pm MT");
    expect(shortZone("7:00 am - 12:00 pm PDT")).toBe("7:00 am - 12:00 pm PT");
    expect(shortZone("9:00 - 11:00 am CDT")).toBe("9:00 - 11:00 am CT");
  });

  it("keeps the AK prefix — order in the alternation is load-bearing", () => {
    // With "A" ahead of "AK", AKDT would lose the K.
    expect(shortZone("11:00 am - 1:00 pm AKDT")).toBe("11:00 am - 1:00 pm AKT");
    expect(shortZone("10:00 am - 2:00 pm HST")).toBe("10:00 am - 2:00 pm HT");
  });

  it("is idempotent, so an already-short value survives a round trip", () => {
    expect(shortZone("9:30 - 10:30 AM MT")).toBe("9:30 - 10:30 AM MT");
    expect(shortZone(shortZone("1:00 pm PDT"))).toBe("1:00 pm PT");
  });

  it("leaves ordinary words alone — this is why it is case-sensitive", () => {
    // A case-insensitive rule would eat the "est" in "best" the moment a word
    // boundary lined up.
    expect(shortZone("the best time")).toBe("the best time");
    expect(shortZone("EAST coast")).toBe("EAST coast");
    expect(shortZone("Varies by day - see event details")).toBe("Varies by day - see event details");
    expect(shortZone("")).toBe("");
  });
});


// ---------------------------------------------------------------------------
// Card titles.
//
// Eight of the 135 live events rendered a title the CMS did not hold, the worst
// being "Roadmap Conference - Seattle, WA - WA 98101". Two separate faults
// stacked: the location parser counted segments from the end and a trailing
// ", United States" shifted every one of them, and eventDisplayTitle appended
// the result to a stored title that already named the city.
// ---------------------------------------------------------------------------

const AT = (location: string, over: Partial<EventItem> = {}): EventItem =>
  ({ ...BASE, title: "EV Expo", location, ...over });

describe("parsing a city and state out of a location", () => {
  it("ignores a trailing country — the bug behind the doubled titles", () => {
    const e = AT("Seattle Convention Center - 705 Pike St, Seattle, WA 98101, United States");
    expect(eventCity(e)).toBe("Seattle");
    expect(eventStateCode(e)).toBe("WA");
  });

  it("handles a country sitting behind the postcode, either side of the border", () => {
    expect(eventCity(AT("430 The Boardwalk, Waterloo, ON N2T 0C2, Canada"))).toBe("Waterloo");
    expect(eventStateCode(AT("430 The Boardwalk, Waterloo, ON N2T 0C2, Canada"))).toBe("ON");
    expect(eventCity(AT("3150 Paradise Rd, Las Vegas, NV 89109, USA"))).toBe("Las Vegas");
  });

  it("still reads a plain address with no country", () => {
    expect(eventCity(AT("Rose Bowl, 1001 Rose Bowl Dr, Pasadena, CA 91103"))).toBe("Pasadena");
    expect(eventStateCode(AT("Rose Bowl, 1001 Rose Bowl Dr, Pasadena, CA 91103"))).toBe("CA");
    expect(eventCity(AT("Great Falls, VA"))).toBe("Great Falls");
  });

  it("refuses a segment with a digit in it, because that is a street, not a city", () => {
    // The comma landed in the wrong place: the venue and the street number ran
    // together, so segment-counting put the address where the city should be.
    expect(eventCity(AT("Anytime Fitness Parking Lot - 19950 Fisher Ave Poolesville, MD 20837"))).toBe("");
  });

  it("gives nothing for an online event, so nothing is appended", () => {
    expect(eventCity(AT("Online — Live Webinar"))).toBe("");
    expect(eventCity(AT("See event details"))).toBe("");
    expect(eventCity(AT("Nationwide"))).toBe("");
  });
});

describe("which title an event card shows", () => {
  it("shows a CMS row's title verbatim — an editor typed it, so it wins", () => {
    const e = AT("Seattle Convention Center - 705 Pike St, Seattle, WA 98101, United States", {
      id: "36b2d013-bacc-4057-a76e-147c1fdc9523",
      title: "Roadmap Conference - Seattle, WA",
    });
    expect(eventDisplayTitle(e)).toBe("Roadmap Conference - Seattle, WA");
  });

  it("does not append even when the stored title names no city at all", () => {
    // The old rule appended here, which is how the back end and the live site
    // came to disagree. Whatever is in the CMS is what ships; if a title needs a
    // city, it gets edited in the CMS.
    const e = AT("Detroit, MI", { id: "row-1", title: "MOVE America 2026" });
    expect(eventDisplayTitle(e)).toBe("MOVE America 2026");
  });

  it("still appends the city for a feed event, which has no row and no city", () => {
    expect(eventDisplayTitle(AT("Park Ridge, IL 60068"))).toBe("EV Expo - Park Ridge, IL");
  });

  it("appends a bare city when the location carries no state code", () => {
    expect(eventDisplayTitle(AT("Oslo, Norway", { title: "Nordic EV Summit 2027" })))
      .toBe("Nordic EV Summit 2027 - Oslo");
  });

  it("leaves a feed title alone when it already names the city", () => {
    expect(eventDisplayTitle(AT("Knoxville, TN", { title: "Knoxville Drive Electric Festival" })))
      .toBe("Knoxville Drive Electric Festival");
  });
});


// ---------------------------------------------------------------------------
// Searching the events page by state.
//
// The search box matched the query as a raw substring across region, location,
// title AND type. Typing "ca" for California returned 86 of 139 events, because
// it also hit "Showcase", "Car Show" and "Chicago". A search for a place has to
// be answered by place.
// ---------------------------------------------------------------------------

const AT2 = (over: Partial<EventItem>): EventItem => ({ ...BASE, ...over });

describe("reading which state an event is in", () => {
  it("takes it from the location", () => {
    expect(eventState(AT2({ location: "1591 Spinnaker Dr, Ventura, CA 93001" }))).toBe("CA");
  });

  it("falls back to region when the location is only a venue", () => {
    expect(eventState(AT2({ location: "Los Angeles Convention Center", region: "Los Angeles, CA" }))).toBe("CA");
  });

  it("understands a state spelled out in full", () => {
    expect(eventState(AT2({ location: "Mile High in Denver, Colorado" }))).toBe("CO");
    expect(eventState(AT2({ location: "", region: "California" }))).toBe("CA");
  });

  it("prefers the longer name, so West Virginia is not Virginia", () => {
    expect(eventState(AT2({ location: "Charleston, West Virginia" }))).toBe("WV");
  });

  it("uses the title only as a last resort, and only for a trailing state code", () => {
    // A trailing ", ST" is this site's own naming convention, so it is an
    // editor's assertion rather than a guess.
    expect(eventState(AT2({ location: "", region: "", title: "EV Show - Poolesville, MD" }))).toBe("MD");
  });

  it("will not read a state NAME out of a title, however tempting", () => {
    // This was tried and removed. It filed the Washington Auto Show (a DC event)
    // under Washington State, and a Kansas City club under Kansas when Kansas
    // City is in Missouri. A title is not a location. The cost is that a feed
    // event with a bare venue name and a state only in its title now has no
    // state at all, which is the honest answer.
    expect(eventState(AT2({ location: "Online", title: "Washington Auto Show" }))).toBe("");
    expect(eventState(AT2({ location: "Online", title: "Kansas City EV Club Monthly" }))).toBe("");
    expect(eventState(AT2({ location: "Denton Square", title: "North Texas EV Showcase" }))).toBe("");
  });

  it("reads a spelled-out state only as a whole segment, never as a substring", () => {
    // Each of these was wrong when the name scan was a substring test over the
    // whole address, longest name first.
    expect(eventState(AT2({ location: "Kansas City", region: "" }))).toBe("");            // Missouri, not KS
    expect(eventState(AT2({ location: "California, Maryland" }))).toBe("MD");             // a real town in MD
    expect(eventState(AT2({ location: "Virginia Ave Park, Santa Monica" }))).toBe("");    // a street, not a state
    expect(eventState(AT2({ location: "1300 Pennsylvania Ave NW, Washington, DC" }))).toBe("DC");
  });

  it("handles a state code written with periods", () => {
    // "D.C." matched no state pattern, so the event fell through to the name
    // scan and was filed under Washington STATE.
    expect(eventState(AT2({ location: "Washington, D.C." }))).toBe("DC");
  });

  it("refuses two capital letters that are not a real state code", () => {
    // "UC" is not a state. Answering it short-circuited every fallback below
    // and left the event matching no search at all.
    expect(eventState(AT2({ location: "Berkeley, UC Campus" }))).toBe("");
  });

  it("never reads a state out of a partial word — the bug that started this", () => {
    // "Showcase" contains "ca". Under the old substring search this event came
    // back for California; it is in North Carolina.
    const e = AT2({ title: "EV Showcase", type: "EV Showcase", location: "Raleigh, NC" });
    expect(eventState(e)).toBe("NC");
  });

  it("gives nothing for online and out-of-country events", () => {
    expect(eventState(AT2({ location: "Online — Live Webinar", region: "Online" }))).toBe("");
    expect(eventState(AT2({ location: "Nationwide", region: "" }))).toBe("");
    expect(eventState(AT2({ location: "Oslo, Norway", region: "Oslo, Norway" }))).toBe("");
  });
});

describe("reading a state out of a search query", () => {
  it("accepts a code in either case", () => {
    expect(parseStateQuery("ca")).toBe("CA");
    expect(parseStateQuery("NY")).toBe("NY");
    expect(parseStateQuery(" tx ")).toBe("TX");
  });

  it("accepts a full name, including two-word ones", () => {
    expect(parseStateQuery("california")).toBe("CA");
    expect(parseStateQuery("new york")).toBe("NY");
    expect(parseStateQuery("west virginia")).toBe("WV");
  });

  it("accepts an unambiguous partial name", () => {
    expect(parseStateQuery("calif")).toBe("CA");
    expect(parseStateQuery("penns")).toBe("PA");
  });

  it("refuses an ambiguous or too-short partial", () => {
    // Five states start with "new"; picking one silently would be worse than
    // treating it as ordinary text.
    expect(parseStateQuery("new")).toBe("");
    expect(parseStateQuery("mi")).toBe("MI");   // a real code, not a partial
    expect(parseStateQuery("cal")).toBe("");    // under four characters
  });

  it("leaves ordinary searches alone", () => {
    expect(parseStateQuery("napa")).toBe("");
    expect(parseStateQuery("conference")).toBe("");
    expect(parseStateQuery("30301")).toBe("");
    expect(parseStateQuery("")).toBe("");
  });
});

describe("matching free text to a word", () => {
  it("matches the start of a word, not the middle of one", () => {
    expect(startsWord("EV Showcase", "ca")).toBe(false);
    expect(startsWord("Tailgate & Car Show", "car")).toBe(true);
    expect(startsWord("Conference", "conf")).toBe(true);
  });

  it("matches after punctuation and digits", () => {
    expect(startsWord("Atlanta, 30301", "30301")).toBe(true);
    expect(startsWord("StoreLocal Napa, 1111 Soscol Ferry Road", "napa")).toBe(true);
  });

  it("treats a multi-word query as a phrase", () => {
    expect(startsWord("San Diego Convention Center", "san diego")).toBe(true);
    expect(startsWord("San Francisco", "san diego")).toBe(false);
  });

  it("is safe on blank input", () => {
    expect(startsWord("", "ca")).toBe(false);
  });
});

// The Part 2 webinar ran on 27 Aug 2026 and its recording now lives at
// /from-pump-to-plug-part-2. Its CMS row was set back to draft, which the
// listing could not act on by itself — mergeEvents re-appends any curated event
// that no PUBLISHED row matched, so the hardcoded entry outlived its own row and
// kept a "register now" link live over a date that had passed. It is retired the
// ordinary way instead: no `ours`, so isActive drops it once the date is behind
// us. The entry stays in the catalog because /events/from-pump-to-plug is a
// dedicated route whose page falls back to EVENTS.find(slug).
describe("the Part 2 webinar is retired, not deleted", () => {
  const part2 = EVENTS.find((e) => e.slug === "from-pump-to-plug");

  it("is still in the catalog, so its dedicated page can find it", () => {
    expect(part2).toBeTruthy();
  });

  it("does not claim `ours`, which would keep it listed forever", () => {
    expect(part2!.ours).toBeFalsy();
  });

  it("is no longer active now its date has passed", () => {
    vi.setSystemTime(new Date("2026-08-29T12:00:00Z"));
    expect(isActive(part2!)).toBe(false);
    vi.useRealTimers();
  });
});
