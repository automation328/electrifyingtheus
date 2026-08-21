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
