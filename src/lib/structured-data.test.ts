import { describe, it, expect } from "vitest";
import { absoluteUrl, blogPostingLd, breadcrumbLd, eventLd, eventStartDate, homeLd, isoDate, plainText, TOOL_PATHS, webApplicationLd } from "./structured-data";
import { ogFor } from "@/components/SeoHead";

const event = {
  slug: "ev-basics-hopkins-mn-sep-30-2026", title: "EV Basics - Hopkins, MN", description: "Intro night.",
  image: "/assets/flyer.jpg", location: "Hopkins Library, Hopkins, MN", month: "SEP", day: "30", year: 2026,
};

describe("structured data", () => {
  it("makes image paths absolute and drops data URLs", () => {
    expect(absoluteUrl("/og/x.jpg")).toBe("https://electrifyingtheus.com/og/x.jpg");
    expect(absoluteUrl("https://cdn.example/x.jpg")).toBe("https://cdn.example/x.jpg");
    expect(absoluteUrl("data:image/png;base64,AA")).toBeUndefined();
    expect(absoluteUrl("")).toBeUndefined();
  });

  it("turns written dates into ISO dates", () => {
    expect(isoDate("June 25, 2026")).toBe("2026-06-25");
    expect(isoDate("not a date")).toBeUndefined();
    expect(eventStartDate({ month: "JUL", day: "9", year: 2026 })).toBe("2026-07-09");
    expect(eventStartDate({ month: "??", day: "9", year: 2026 })).toBeUndefined();
  });

  it("describes an in-person event with its place and organizer", () => {
    const ld = eventLd(event)!;
    expect(ld["@type"]).toBe("Event");
    expect(ld.startDate).toBe("2026-09-30");
    expect(ld.endDate).toBe("2026-09-30");
    expect(ld.location).toEqual({ "@type": "Place", name: event.location, address: event.location });
    expect(ld.image).toEqual(["https://electrifyingtheus.com/assets/flyer.jpg"]);
    expect(ld.organizer).toBeDefined();
  });

  it("marks webinars as online and does not claim feed events", () => {
    const ld = eventLd({ ...event, location: "Online webinar", registerUrl: "https://zoom.us/x", external: true })!;
    expect(ld.eventAttendanceMode).toBe("https://schema.org/OnlineEventAttendanceMode");
    expect(ld.location).toEqual({ "@type": "VirtualLocation", url: "https://zoom.us/x" });
    expect(ld).not.toHaveProperty("organizer");
  });

  it("strips list markers and markdown from event descriptions", () => {
    expect(plainText("Come by for:\n- EV incentives\n* **Public** charging\n1. Food")).toBe("Come by for: EV incentives Public charging Food");
    expect(plainText("Well-known — Denver, CO")).toBe("Well-known — Denver, CO");
  });

  it("skips an event with no usable start date", () => {
    expect(eventLd({ ...event, month: "" })).toBeNull();
  });

  it("describes a blog post", () => {
    const ld = blogPostingLd({ slug: "a", title: "T", excerpt: "E", date: "June 25, 2026", author: "Jane Doe", image: "/og/a.jpg" });
    expect(ld.datePublished).toBe("2026-06-25");
    expect(ld.author).toEqual({ "@type": "Person", name: "Jane Doe" });
    expect(ld.url).toBe("https://electrifyingtheus.com/blog/a");
  });

  it("describes the organization and website on the home page", () => {
    const types = homeLd()["@graph"].map((n) => n["@type"]);
    expect(types).toEqual(["Organization", "WebSite"]);
  });
});

describe("breadcrumbs and tools", () => {
  it("starts breadcrumbs at Home with absolute URLs and positions", () => {
    const ld = breadcrumbLd([{ name: "Events", path: "/events" }, { name: "Expo", path: "/events/expo" }]);
    expect(ld.itemListElement.map((c) => [c.position, c.name, c.item])).toEqual([
      [1, "Home", "https://electrifyingtheus.com/"],
      [2, "Events", "https://electrifyingtheus.com/events"],
      [3, "Expo", "https://electrifyingtheus.com/events/expo"],
    ]);
  });

  it("describes every tool page from its og-data entry", () => {
    for (const p of TOOL_PATHS) expect(ogFor(p), `${p} needs an og-data.ts entry`).toBeDefined();
    const ld = webApplicationLd("/range-map", "EV Range Map", "How far");
    expect(ld.url).toBe("https://electrifyingtheus.com/range-map");
    expect(ld.offers.price).toBe("0");
  });
});

describe("ogFor", () => {
  it("finds a page's og-data entry, ignoring a trailing slash", () => {
    expect(ogFor("/range-map")?.title).toMatch(/Range Map/);
    expect(ogFor("/range-map/")?.title).toMatch(/Range Map/);
    expect(ogFor("/no-such-page")).toBeUndefined();
  });
});
