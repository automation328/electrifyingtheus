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
import { buildHtml, buildText, senderLabel } from "./share-email";

const EVENT = {
  title: "Montbello Alive EV Ride & Drive - Denver, CO",
  description:
    "Come celebrate Montbello Alive with a free, family-friendly morning of community, music, food, and electric vehicles! Following the Montbello Alive 5K, Women Who Charge and the Colorado Branch of EVA invite you to stop by our EV Ride & Drive and experience electric driving for yourself. Take a spin in one of the latest EVs, try a vehicle you've been thinking about, or discover a model you may not have considered.",
  url: "https://electrifyingtheus.com/events/montbello",
  greetName: "Terry",
  sharedBy: "ETUS Team",
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

describe("who it says shared it", () => {
  it("is the sender's name and never their email address", () => {
    expect(senderLabel("Dana Reyes", "friend@example.com", "dana@example.com")).toBe("Dana Reyes");
  });

  it("keeps the address out of the rendered email entirely", () => {
    const html = buildHtml({
      ...EVENT,
      sharedBy: senderLabel("Dana Reyes", "friend@example.com", "dana@example.com"),
    });
    expect(html).toContain("Dana Reyes shared this with you:");
    expect(html).not.toContain("dana@example.com");
    expect(html).not.toContain("@example.com");
  });

  it("carries the same attribution in the plain-text part", () => {
    expect(buildText(EVENT)).toContain("ETUS Team shared this with you:");
  });

  it("says nothing at all on a self-send — the recipient IS the sender", () => {
    expect(senderLabel("Dana Reyes", "dana@example.com", "Dana@Example.com ")).toBe("");
    const html = buildHtml({
      ...EVENT,
      sharedBy: senderLabel("Dana Reyes", "dana@example.com", "dana@example.com"),
    });
    expect(html).not.toContain("shared this with you:");
  });

  it("says nothing when the sender left their name blank", () => {
    expect(senderLabel("   ", "friend@example.com", "dana@example.com")).toBe("");
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

  // The disclaimer slot is never empty. A surface without its own legal copy used
  // to reach the inbox with no informational notice at all.
  it("labels the disclaimer as a third-party event notice on an event", () => {
    expect(buildHtml(EVENT)).toContain("Disclaimer/Third Party Event:");
  });

  it("still shows a labelled disclaimer when the caller sent none", () => {
    const html = buildHtml({ title: "T", url: "https://x.test" });
    expect(html).toContain("Disclaimer:");
    expect(html).toContain("not constitute financial, legal, or tax advice");
  });

  it("carries the disclaimer and both legal links in the plain-text part", () => {
    const text = buildText({ title: "T", url: "https://x.test" });
    expect(text).toContain("Disclaimer: ");
    expect(text).toContain("Privacy Policy: ");
    expect(text).toContain("Terms & Conditions: ");
  });
});

describe("non-event shares keep the eyebrow + headline layout", () => {
  const ARTICLE = {
    title: "Why 2026 is the tipping point",
    description: "A look at the year EVs stopped being the alternative.",
    meta: "News · Aug 27, 2026",
    url: "https://electrifyingtheus.com/blog/tipping-point",
    greetName: "Terry",
    sharedBy: "ETUS Team",
  };

  it("still renders the eyebrow + headline and the default CTA", () => {
    const html = buildHtml(ARTICLE);
    expect(html).toContain("News · Aug 27, 2026");
    expect(html).toContain("<h1");
    expect(html).toContain("Read more &rarr;");
    expect(html).not.toContain("Event:");
    expect(html).not.toContain("Date/Time:");
  });

  it("carries the CTA label the surface asked for", () => {
    expect(buildHtml({ ...ARTICLE, ctaLabel: "Read Article" })).toContain("Read Article &rarr;");
    expect(buildHtml({ ...ARTICLE, ctaLabel: "View Job" })).toContain("View Job &rarr;");
  });

  it("does not truncate a short description", () => {
    expect(buildHtml(ARTICLE)).toContain(ARTICLE.description);
  });
});

// Greeting, then "<sender> shared this with you:", then the content, then a CTA,
// then the footer with both legal links. An article share used to open cold on a
// headline and bury the sender under the fine print; only events got the full
// treatment. Every surface now sends the same shape.
describe("every share opens the same way", () => {
  const ARTICLE = {
    title: "Why 2026 is the tipping point",
    description: "A look at the year EVs stopped being the alternative.",
    url: "https://electrifyingtheus.com/blog/tipping-point",
    greetName: "Terry",
    sharedBy: "ETUS Team",
    ctaLabel: "Read Article",
  };

  it("leads with the sender on a non-event share too", () => {
    const html = buildHtml(ARTICLE);
    const sender = html.indexOf("ETUS Team shared this with you:");
    const headline = html.indexOf("<h1");
    expect(sender).toBeGreaterThan(-1);
    expect(sender).toBeLessThan(headline);
  });

  it("says it only once", () => {
    expect(buildHtml(ARTICLE).split("shared this with you:")).toHaveLength(2);
  });

  it("greets even when the sender did not name the recipient", () => {
    expect(buildHtml({ ...ARTICLE, greetName: undefined })).toContain("Hi there,");
    expect(buildHtml(ARTICLE)).toContain("Hi Terry,");
  });
});

// The calculator is the only surface whose headline restates its own number, so
// it is the only one where meta can collide with the title.
describe("a calculator share headline", () => {
  const RESULT = {
    title: "The Kia EV6 saves about $1,135/year on fuel vs the Toyota RAV4",
    url: "https://electrifyingtheus.com/electricity-vs-gasoline",
    ctaLabel: "See Full Results",
  };

  it("colours the figure in place when the headline already states it", () => {
    const html = buildHtml({ ...RESULT, meta: "$1,135/year" });
    expect(html).toContain("saves about <span style=\"color:#2f9e57\">$1,135/year</span> on fuel");
    // No eyebrow: the figure is inside the headline, not repeated above it.
    expect(html).not.toContain("font:800 22px/1.2");
  });

  it("falls back to the eyebrow when meta is a different figure", () => {
    // The regression: "saves about $9,000 saved over 5 years on fuel — $1,135/year
    // on fuel vs the Toyota RAV4" — stated twice, sentence broken by an em dash.
    const html = buildHtml({ ...RESULT, meta: "$9,000 saved over 5 years on fuel" });
    expect(html).not.toContain("saves about $9,000");
    expect(html).toContain(">$9,000 saved over 5 years on fuel</p>");
    expect(html).toContain("The Kia EV6 saves about $1,135/year on fuel vs the Toyota RAV4");
  });
});

// A share that reaches an inbox with no visible button is a share that goes
// nowhere. Clients differ on which of the two background mechanisms they keep,
// so the button must survive losing either one.
describe("the CTA button always renders as a button", () => {
  const ARTICLE = { title: "T", url: "https://x.test", ctaLabel: "Read Article" };

  it("colours the cell with both a bgcolor attribute and a style", () => {
    const html = buildHtml(ARTICLE);
    expect(html).toContain('bgcolor="#0b5fd4"');
    expect(html).toContain("background-color:#0b5fd4");
  });

  it("puts the colour on the link itself, not only the cell", () => {
    // White label on a cell that lost its background is an invisible button.
    const html = buildHtml(ARTICLE);
    const link = html.slice(html.indexOf("<a href=\"https://x.test\""));
    expect(link).toContain("color:#ffffff");
    expect(link).toContain("background-color:#0b5fd4");
    expect(link).toContain("border:1px solid");
  });

  it("renders on every share, labelled or not", () => {
    expect(buildHtml({ title: "T", url: "https://x.test" })).toContain("Read more &rarr;");
    expect(buildHtml(ARTICLE)).toContain("Read Article &rarr;");
  });
});

// A mail whose From is @electrifyingtheus.com while every link points at a
// different host is a spam signal, and some of these were landing in spam.
describe("every link sits on the sending domain", () => {
  it("never points an email at the vercel.app host", () => {
    const html = buildHtml({ title: "T", url: "https://electrifyingtheus.com/x", ctaLabel: "Go" });
    expect(html).not.toContain("vercel.app");
    expect(buildText({ title: "T", url: "https://electrifyingtheus.com/x" })).not.toContain("vercel.app");
  });

  it("puts the legal links on the apex domain", () => {
    const html = buildHtml({ title: "T", url: "https://electrifyingtheus.com/x" });
    expect(html).toContain("https://electrifyingtheus.com/privacy-policy");
    expect(html).toContain("https://electrifyingtheus.com/terms");
  });
});

describe("the plain-text part is a whole email", () => {
  const ARTICLE = {
    title: "Why 2026 is the tipping point",
    description: "A look at the year EVs stopped being the alternative.",
    url: "https://electrifyingtheus.com/blog/tipping-point",
    greetName: "Terry",
    sharedBy: "ETUS Team",
    ctaLabel: "Read Article",
  };

  it("greets, attributes, links and closes with the legal pages", () => {
    const text = buildText(ARTICLE);
    expect(text).toContain("Hi Terry,");
    expect(text).toContain("ETUS Team shared this with you:");
    expect(text).toContain("Read Article: https://electrifyingtheus.com/blog/tipping-point");
    expect(text).toContain("Privacy Policy: ");
    expect(text).toContain("Terms & Conditions: ");
  });

  it("carries the legal links on an event share as well", () => {
    const text = buildText(EVENT);
    expect(text).toContain("Privacy Policy: ");
    expect(text).toContain("Terms & Conditions: ");
  });
});
