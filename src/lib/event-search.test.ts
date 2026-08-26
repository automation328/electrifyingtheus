// The events-page search box.
//
// Every test here is a query that once returned the wrong thing on the live
// site. The first version of this search fixed one bug ("ca" matching
// "Showcase") and introduced a worse one: it committed to the state branch
// unconditionally, so any query naming a state with no events rendered "No
// events match" over a page full of matches. Nine queries did that.
//
// The rule that came out of it: every branch is a hypothesis, and a hypothesis
// that finds nothing hands over to the next one.

import { describe, it, expect } from "vitest";
import { filterEvents } from "@/lib/event-search";
import type { EventItem } from "@/data/events";

const ev = (title: string, location: string, region = "", type = "Event"): EventItem => ({
  title, location, region, type,
  month: "SEP", day: "01", year: 2026, time: "", description: "", image: "",
});

// A miniature version of the real listing: several states, an online event, a
// hyphenated city, a DC event, and the title words that used to swallow short
// queries ("Showcase", "Car Show", "Drive Electric Month").
const LIST: EventItem[] = [
  ev("LA Auto Show / AutoMobility 2026 - Los Angeles, CA", "Los Angeles Convention Center", "Los Angeles, CA"),
  ev("Take Charge East LA Ride and Drive - Los Angeles, CA", "Lincoln Park, 3501 Valley Blvd, Los Angeles, CA 90031"),
  ev("EV Showcase at Santa Maria - Santa Maria, CA", "451 S. McClelland St., Santa Maria, CA 93454", "", "EV Showcase"),
  ev("Sparking Connections - Denver, CO", "1550 Wewatta St, Denver, CO 80202"),
  ev("Drive Clean Summit + Expo 2026 - Denver, CO", "Mile High in Denver, Colorado"),
  ev("EVs in DC 2026 - Washington, DC", "14th St and Madison Dr NW, Washington, DC 20004"),
  ev("Seattle Drive Electric - Seattle, WA", "Seattle Center, Seattle, WA 98109"),
  ev("Winston-Salem EV Meetup - Winston-Salem, NC", "Bailey Park, Winston-Salem, NC 27101"),
  ev("Portland EV Ride and Drive - Portland, OR", "Tom McCall Waterfront Park, Portland, OR 97204"),
  ev("National Drive Electric Month - Nationwide Events", "Nationwide"),
  ev("Part 2: From The Pump To The Plug", "Online · Live Webinar", "Online", "Webinar"),
];

const titles = (q: string) => filterEvents(LIST, q).map((e) => e.title);
const n = (q: string) => filterEvents(LIST, q).length;

describe("searching by state", () => {
  it("answers a state code with that state, not with words that contain it", () => {
    // The original bug: "ca" matched "ShowCAse" and "LA Auto Show" alike.
    expect(n("ca")).toBe(3);
    expect(titles("ca").every((t) => t.includes(", CA"))).toBe(true);
  });

  it("gives the same answer for the code, the name and a partial name", () => {
    expect(titles("ca")).toEqual(titles("california"));
    expect(titles("ca")).toEqual(titles("calif"));
  });

  it("falls back to text when the state has no events, instead of a blank page", () => {
    // "la" is Louisiana AND how Americans write Los Angeles. There are no
    // Louisiana events, and committing to the state branch hid both LA events
    // behind "No events match". This is the regression that mattered most.
    expect(n("la")).toBeGreaterThan(0);
    expect(titles("la")).toContain("LA Auto Show / AutoMobility 2026 - Los Angeles, CA");
  });

  it("does not let a state name swallow an ordinary word", () => {
    // "mont" is an unambiguous prefix of Montana, which has no events -- and it
    // is also the start of "Month", which titles 1 event here and 13 live.
    expect(titles("mont")).toContain("National Drive Electric Month - Nationwide Events");
  });

  it("includes a city that shares its name with a state", () => {
    // "washington" is Washington State, but it is also Washington, DC. Filtering
    // purely by state dropped the DC event entirely.
    expect(titles("washington")).toContain("Seattle Drive Electric - Seattle, WA");
    expect(titles("washington")).toContain("EVs in DC 2026 - Washington, DC");
  });

  it("still narrows hard when the state does have events", () => {
    // The fallback must not quietly undo the original fix.
    expect(n("ca")).toBeLessThan(LIST.length);
    expect(titles("ca")).not.toContain("Sparking Connections - Denver, CO");
  });
});

describe("searching by place and state together", () => {
  it("does not require the comma", () => {
    // "denver, co" worked and "denver co" found nothing. The comma was
    // load-bearing and invisible.
    expect(titles("denver co")).toEqual(titles("denver, co"));
    expect(n("denver co")).toBe(2);
  });

  it("accepts the state spelled out", () => {
    expect(n("denver colorado")).toBe(2);
  });

  it("works for a state code that is also an English word", () => {
    expect(titles("portland or")).toEqual(["Portland EV Ride and Drive - Portland, OR"]);
  });

  it("does not match a different city in the same state", () => {
    expect(n("san diego ca")).toBe(0);
  });
});

describe("searching by ZIP", () => {
  it("matches an address that carries the ZIP", () => {
    expect(titles("80202")).toEqual(["Sparking Connections - Denver, CO"]);
  });

  it("falls back to the ZIP's state when no address carries it", () => {
    // The placeholder in the box says "e.g. Atlanta, 30301" and a ZIP that was
    // not literally inside an address returned nothing at all.
    expect(n("98101")).toBe(1);                    // a Seattle ZIP, no exact match
    expect(titles("98101")).toEqual(["Seattle Drive Electric - Seattle, WA"]);
  });
});

describe("searching by text", () => {
  it("matches the start of a word, not the middle of one", () => {
    expect(titles("car")).toEqual([]);             // no "Car Show" in this list
    expect(n("charge")).toBe(1);
  });

  it("handles a hyphenated city name", () => {
    // No word in the text can contain a hyphen, so matching the raw string
    // "winston-salem" could never succeed. Tokenising the query fixes it.
    expect(n("winston-salem")).toBe(1);
    expect(titles("winston-salem")).toEqual(titles("winston salem"));
  });

  it("requires every word to match, so a phrase is not a loose OR", () => {
    expect(n("drive electric")).toBe(2);
    expect(n("drive electric narnia")).toBe(0);
  });

  it("finds online events", () => {
    expect(titles("online")).toEqual(["Part 2: From The Pump To The Plug"]);
    expect(titles("webinar")).toEqual(["Part 2: From The Pump To The Plug"]);
  });

  it("returns everything for a blank query", () => {
    expect(n("")).toBe(LIST.length);
    expect(n("   ")).toBe(LIST.length);
  });

  it("returns nothing for a query that genuinely matches nothing", () => {
    expect(n("zzzzz")).toBe(0);
  });
});
