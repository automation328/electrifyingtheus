import { beforeEach, describe, expect, it, vi } from "vitest";

// A fake site_events table that records every update.
const updates: Array<Record<string, unknown>> = [];
const event = { id: "ev1", title: "Test Event", status: "draft", event_date: "2027-01-01" };
const fakeDb = {
  from: () => ({
    select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: { ...event } }) }) }),
    update: (row: Record<string, unknown>) => { updates.push(row); return { eq: async () => ({ error: null }) }; },
  }),
};

vi.mock("./_admin-auth.js", () => ({ adminSupabase: () => fakeDb, getEditor: vi.fn(), requireEditor: vi.fn() }));
vi.mock("./_rate-limit.js", () => ({
  checkAuthRateLimit: async () => ({ ok: true }),
  checkRateLimit: async () => ({ ok: true }),
  tooManyRequests: vi.fn(),
}));

import handler from "./admin";
import { signReview } from "./_event-submission";

const makeRes = () => {
  const r = { code: 0, body: "", status(c: number) { r.code = c; return r; }, setHeader() {}, send(b: string) { r.body = b; return r; }, json(b: unknown) { r.body = JSON.stringify(b); return r; } };
  return r;
};

describe("Slack event review links", () => {
  beforeEach(() => {
    updates.length = 0;
    process.env.EVENT_REVIEW_SECRET = "test-secret";
  });

  const params = () => {
    const exp = Date.now() + 3_600_000; // ms, as verifyReview expects
    return { op: "event-review", id: "ev1", action: "reject", exp: String(exp), sig: signReview("ev1", "reject", exp) ?? "" };
  };

  it("a GET (link preview, prefetch, click) only shows a confirm button and changes nothing", async () => {
    const res = makeRes();
    await handler({ method: "GET", query: params(), headers: {} }, res);
    expect(res.code).toBe(200);
    expect(res.body).toContain('<form method="post"');
    expect(updates).toEqual([]);
  });

  it("the confirm button's POST makes the change", async () => {
    const { op, ...body } = params();
    const res = makeRes();
    await handler({ method: "POST", query: { op }, body, headers: {} }, res);
    expect(res.code).toBe(200);
    expect(updates).toEqual([{ status: "archived" }]);
  });

  it("a POST with a bad signature changes nothing", async () => {
    const { op, ...body } = params();
    const res = makeRes();
    await handler({ method: "POST", query: { op }, body: { ...body, sig: "nope" }, headers: {} }, res);
    expect(res.code).toBe(400);
    expect(updates).toEqual([]);
  });
});
