// The share email is the only thing a recipient ever sees of a shared event, and
// it is assembled as one big template literal — so the checks that matter are
// about what actually lands in the markup, not about how it is built.
//
// An event share used to reuse the generic layout: a green eyebrow that ran
// "TYPE · VENUE · STREET ADDRESS · DATE · TIME" together, then the title as a
// headline. Mail clients auto-linked the postal address out of the middle of the
// eyebrow, so it rendered as a green sentence with a blue underlined address
// buried in it. Events now get labelled rows instead.

import { describe, it, expect } from "vitest";
import { buildHtml, buildText } from "./share-email";

const EVENT = {
  title: "Montbello Alive EV Ride & Drive - Denver, CO",
  description:
    "Come celebrate Montbello Alive with a free, family-friendly morning of community, music, food, and electric vehicles! Following the Montbello Alive 5K, Women Who Charge and the Colorado Branch of EVA invite you to stop by our EV Ride & Drive and experience electric driving for yourself. Take a spin in one of the latest EVs, try a vehicle you've been thinking about, or discover a model you may not have considered.",
  url: "https://electrifyingtheus.com/events/montbello",
  greetName: "Terry",
  sharedBy: "ETUS Team (info@electrifyingtheus.com)",
  eventDateTime: "Saturday, SEP 19, 2026 · 11a - 4p",
  ctaLabel: "Events Details",
  disclaimer: "This event is organized and managed by an independent third party.",
};

describe("event share email", () => {
  it("labels what it is, when it is, and what happens there", () => {
    const html = buildHtml(EVENT);
    expect(html).toContain("Event: Montbello Alive EV Ride &amp; Drive - Denver, CO");
    expect(html).toContain("Date/Time: Saturday, SEP 19, 2026 · 11a - 4p");
    expect(html).toContain("Event details:");
    expect(html).toContain("Events Details &rarr;");
  });

  it("leads with who sent it, instead of burying it under the fine print", () => {
    const html = buildHtml(EVENT);
    const sender = html.indexOf("shared this with you:");
    const details = html.indexOf("Event details:");
    expect(sender).toBeGreaterThan(-1);
    expect(sender).toBeLessThan(details);
  });

  it("never emits the run-together eyebrow for an event", () => {
    // The regression: type · venue · address · date · time as one green line.
    const html = buildHtml({ ...EVENT, meta: "EV Event · Parkfield Lake Park 15555 E. 53rd Ave. Denver, CO 80239 · SEP 19, 2026 · 11a - 4p" });
    expect(html).not.toContain("15555 E. 53rd Ave.");
  });

  it("ends the preview on a whole word and says it continues", () => {
    const html = buildHtml(EVENT);
    const m = html.match(/Event details:<\/span> ([^<]+)</);
    expect(m).toBeTruthy();
    const shown = m![1];
    expect(shown.endsWith("...")).toBe(true);
    // The old build cut wherever the payload cap fell — mid-word, no ellipsis.
    expect(shown).not.toMatch(/\s\S{1,2}\.\.\.$/);
    expect(EVENT.description.startsWith(shown.slice(0, 40))).toBe(true);
  });

  it("carries the same labels in the plain-text part", () => {
    const text = buildText(EVENT);
    expect(text).toContain("Event: Montbello Alive EV Ride & Drive - Denver, CO");
    expect(text).toContain("Date/Time: Saturday, SEP 19, 2026 · 11a - 4p");
    expect(text).toContain("Events Details: https://electrifyingtheus.com/events/montbello");
  });
});

describe("footer", () => {
  it("keeps the shared-from line even when a disclaimer is present", () => {
    // It used to be either/or, so every send carrying legal fine print — exactly
    // the ones where a recipient most wants to know who this is from — lost it.
    const html = buildHtml(EVENT);
    expect(html).toContain("Shared from");
    expect(html).toContain("Disclaimer/Third Party Event:");
  });

  it("always offers the legal links", () => {
    for (const html of [buildHtml(EVENT), buildHtml({ title: "T", url: "https://x.test" })]) {
      expect(html).toContain("/privacy-policy");
      expect(html).toContain("/terms");
    }
  });
});

describe("non-event shares are untouched", () => {
  const ARTICLE = {
    title: "Why 2026 is the tipping point",
    description: "A look at the year EVs stopped being the alternative.",
    meta: "News · Aug 27, 2026",
    url: "https://electrifyingtheus.com/blog/tipping-point",
    greetName: "Terry",
    sharedBy: "ETUS Team (info@electrifyingtheus.com)",
  };

  it("still renders the eyebrow + headline and the default CTA", () => {
    const html = buildHtml(ARTICLE);
    expect(html).toContain("News · Aug 27, 2026");
    expect(html).toContain("<h1");
    expect(html).toContain("Read more &rarr;");
    expect(html).not.toContain("Event:");
    expect(html).not.toContain("Date/Time:");
  });

  it("keeps the sender attribution in the footer, not the top", () => {
    const html = buildHtml(ARTICLE);
    expect(html).toContain("shared this with you.");
    const details = html.indexOf("<h1");
    expect(html.indexOf("shared this with you.")).toBeGreaterThan(details);
  });

  it("does not truncate a short description", () => {
    expect(buildHtml(ARTICLE)).toContain(ARTICLE.description);
  });
});
