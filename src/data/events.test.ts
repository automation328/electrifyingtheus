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
  gcalLink, eventDate, type EventItem,
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
