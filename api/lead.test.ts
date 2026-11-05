import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import handler, { FORM_TAGS } from "./lead";
import type { LeadFormType } from "../src/lib/submitLead";

vi.mock("./_submissions.js", () => ({ recordSubmission: vi.fn() }));
vi.mock("./_rate-limit.js", () => ({ checkRateLimit: async () => ({ ok: true }), tooManyRequests: vi.fn() }));
vi.mock("./_ghl-fields.js", () => ({ buildCustomFields: () => [], customFieldIds: async () => ({}) }));

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
  "webinar-part-3": true,
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
  it("tags Part 3 signups on their own, and keeps the shared event-register tag", () => {
    expect(FORM_TAGS["webinar-part-3"]).toEqual(
      expect.arrayContaining(["website-lead", "event-register", "webinar-part-3"]),
    );
  });

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

// GoHighLevel's upsert replaces a contact's tags, so one form used to wipe what
// an earlier form set: a Part 3 signup lost webinar-part-3 on the next click.
describe("tagging a contact", () => {
  const send = async (body: Record<string, unknown>) => {
    const res = { statusCode: 0, status(c: number) { this.statusCode = c; return this; }, json: vi.fn() };
    await handler({ method: "POST", headers: {}, body }, res);
    return res;
  };
  const calls = () => vi.mocked(fetch).mock.calls.map(([url, init]) => ({
    url: String(url), body: JSON.parse(String(init?.body ?? "{}")),
  }));

  beforeEach(() => {
    vi.stubEnv("GHL_API_KEY", "test-key");
    vi.stubEnv("GHL_LOCATION_ID", "loc");
    vi.stubEnv("GHL_USER_ID", "");
    vi.stubEnv("SLACK_WEBHOOK_URL", "");
    let n = 0;
    vi.stubGlobal("fetch", vi.fn(async () =>
      new Response(JSON.stringify({ contact: { id: `c${++n}` } }), { status: 200 })));
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it("adds tags after the upsert, so a contact keeps the ones it has", async () => {
    await send({ formType: "webinar-part-3", email: "a@example.com" });
    const upsert = calls().find((c) => c.url.endsWith("/contacts/upsert"));
    expect(upsert?.body.tags).toBeUndefined();
    expect(calls().find((c) => c.url.endsWith("/contacts/c1/tags"))?.body.tags)
      .toEqual(FORM_TAGS["webinar-part-3"]);
  });

  it("does the same for a calculator share's sender", async () => {
    await send({ formType: "calculator-share", email: "a@example.com", senderEmail: "b@example.com" });
    expect(calls().filter((c) => c.url.endsWith("/contacts/upsert")).every((c) => !c.body.tags)).toBe(true);
    const tagged = calls().filter((c) => c.url.endsWith("/tags")).flatMap((c) => c.body.tags);
    expect(tagged).toContain("calculator-share-sender");
  });

  it("still answers ok when tagging fails, because the lead is already saved", async () => {
    vi.mocked(fetch).mockImplementation(async (url) => String(url).endsWith("/tags")
      ? new Response("{}", { status: 500 })
      : new Response(JSON.stringify({ contact: { id: "c1" } }), { status: 200 }));
    const res = await send({ formType: "newsletter", email: "a@example.com" });
    expect(res.statusCode).toBe(200);
  });
});
