import { describe, expect, it } from "vitest";
import { eventTitleKey } from "../../event-title-key";
import { mergeEvents } from "./content";
import { EVENTS, eventDisplayTitle, type EventItem } from "@/data/events";

describe("event title key", () => {
  it("drops a location suffix", () => {
    expect(eventTitleKey("Chicago Auto Show 2027 - Chicago, IL")).toBe("Chicago Auto Show 2027");
    expect(eventTitleKey("Nordic EV Summit 2027 - Oslo, Norway")).toBe("Nordic EV Summit 2027");
    expect(eventTitleKey("Winter Driving in an Electric Car - Online")).toBe("Winter Driving in an Electric Car");
  });

  it("keeps a dash that is part of the real title", () => {
    const t = "Part 2: From The Pump To The Plug - How Electric Vehicles Can Save You Thousands";
    expect(eventTitleKey(t)).toBe(t);
  });
});

describe("renamed CMS rows", () => {
  it("still replace their built-in event instead of showing it twice", () => {
    const builtIn = EVENTS.find((e) => e.slug === "chicago-auto-show-2027")!;
    const row: EventItem = { ...builtIn, id: "row-1", slug: undefined, title: "Chicago Auto Show 2027 - Chicago, IL" };
    const merged = mergeEvents([row]).filter((e) => e.year === 2027 && e.month === "FEB" && e.day === "13");
    expect(merged).toHaveLength(1);
    expect(merged[0].id).toBe("row-1");
    expect(merged[0].slug).toBe("chicago-auto-show-2027"); // keeps the built-in URL
  });
});

describe("online events", () => {
  it("get the same ' - Online' suffix as located events get a city", () => {
    const web = EVENTS.find((e) => e.slug === "winter-driving-electric-car-2026")!;
    expect(eventDisplayTitle(web)).toBe("Winter Driving in an Electric Car - Online");
  });
});
