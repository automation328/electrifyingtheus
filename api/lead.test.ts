import { describe, it, expect } from "vitest";
import { FORM_TAGS } from "./lead";
import type { LeadFormType } from "../src/lib/submitLead";

// The bug this file exists to stop: the marketplace enquiry form posted
// formType "marketplace-enquiry", which had a source label in lead.ts but no
// entry in FORM_TAGS — and an unrecognised formType is rejected outright. Every
// "Enquire about this vehicle" came back 400 "Unknown form type", so nobody who
// asked a dealer about a car was ever put through.

/** Every value the client union can send. Adding one to LeadFormType without
 *  adding it here stops the build, which is the point. */
const EVERY_FORM_TYPE: Record<LeadFormType, true> = {
  "homepage-contact": true,
  "contact-us": true,
  "newsletter": true,
  "list-event": true,
  "post-job": true,
  "event-alerts": true,
  "career-alerts": true,
  "job-apply": true,
  "evan-chat": true,
  "calculator-share": true,
  "calculator-unlock": true,
  "photo-share": true,
  "article-share": true,
  "incentive-share": true,
  "event-share": true,
  "event-register": true,
  "event-calendar": true,
  "job-share": true,
  "charger-share": true,
  "vehicle-share": true,
  "marketplace-enquiry": true,
  "eligibility-plan": true,
  "eligibility-coverage": true,
  "video-access": true,
};

describe("the form types the lead endpoint accepts", () => {
  it("carries tags for every form the site can submit", () => {
    const missing = Object.keys(EVERY_FORM_TYPE).filter((t) => !FORM_TAGS[t]);
    expect(missing).toEqual([]);
  });

  it("tags every lead as a website lead, and says where it came from", () => {
    for (const [type, tags] of Object.entries(FORM_TAGS)) {
      expect(tags, type).toContain("website-lead");
      expect(tags.some((t) => t.startsWith("source:")), type).toBe(true);
    }
  });
});
