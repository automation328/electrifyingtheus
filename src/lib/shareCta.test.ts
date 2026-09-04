// Every share surface routes through the same email template, so the CTA button
// is the only thing that tells the recipient where they are being sent. A job
// posting that says "Read More" is the failure this map exists to prevent.

import { describe, it, expect } from "vitest";
import { shareCtaLabel, DEFAULT_SHARE_CTA } from "./shareCta";

describe("share CTA label", () => {
  it("names the destination for each share surface", () => {
    expect(shareCtaLabel("article-share")).toBe("Read Article");
    expect(shareCtaLabel("event-share")).toBe("Events Details");
    expect(shareCtaLabel("photo-share")).toBe("View Photo");
    expect(shareCtaLabel("job-share")).toBe("View Job");
    expect(shareCtaLabel("incentive-share")).toBe("View Incentive");
    expect(shareCtaLabel("charger-share")).toBe("View Charging Map");
    expect(shareCtaLabel("calculator-share")).toBe("See Full Results");
  });

  it("never leaves a share surface on the generic label", () => {
    const SHARE_SURFACES = [
      "article-share", "event-share", "photo-share",
      "job-share", "incentive-share", "charger-share", "calculator-share",
    ] as const;
    for (const t of SHARE_SURFACES) {
      expect(shareCtaLabel(t)).not.toBe(DEFAULT_SHARE_CTA);
    }
  });

  it("falls back for a form type that is not a share surface", () => {
    expect(shareCtaLabel("newsletter")).toBe(DEFAULT_SHARE_CTA);
  });

  it("lets a page override its tag, but ignores a blank one", () => {
    expect(shareCtaLabel("article-share", "See the Recap")).toBe("See the Recap");
    expect(shareCtaLabel("article-share", "   ")).toBe("Read Article");
  });
});
