import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// The limiter talks to Supabase and fails CLOSED when it cannot reach it, which
// is right in production and means every local call would be a 429. Stubbed so
// these tests exercise the password logic; the "metered before the password is
// read" property is asserted separately, below.
vi.mock("./_rate-limit.js", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ ok: true, hits: 1, limit: 10, retryAfter: 900 }),
  tooManyRequests: vi.fn((res: { status: (n: number) => { json: (o: unknown) => void } }) =>
    res.status(429).json({ error: "rate_limited" })),
}));

import handler from "./gate-login";
import { checkRateLimit } from "./_rate-limit.js";
import { SLIDES_COOKIE, slidesToken } from "../slides-gate.js";

const mockRes = () => {
  const out: { status?: number; body?: unknown; headers: Record<string, string> } = { headers: {} };
  const res = {
    _out: out,
    setHeader(k: string, v: string) { out.headers[k.toLowerCase()] = v; return res; },
    status(n: number) { out.status = n; return res; },
    json(b: unknown) { out.body = b; return res; },
  };
  return res;
};

// The deck password rides on the site's one auth endpoint, under its own
// scope — the plan allows twelve serverless functions and this project has
// twelve, so a thirteenth file fails the DEPLOY with the build green.
const post = (password: unknown) =>
  ({ method: "POST", headers: {}, body: { scope: "slides", password } }) as never;

describe("the slides password branch of the gate endpoint", () => {
  const PASSWORD = "deck-pass-2026";

  beforeEach(() => { process.env.SLIDES_PASSWORD = PASSWORD; vi.clearAllMocks(); });
  afterEach(() => { delete process.env.SLIDES_PASSWORD; });

  it("sets an unlock cookie for the right password", async () => {
    const res = mockRes();
    await handler(post(PASSWORD), res);

    expect(res._out.status).toBe(200);
    const cookie = res._out.headers["set-cookie"] ?? "";
    expect(cookie).toContain(`${SLIDES_COOKIE}=${await slidesToken(PASSWORD)}`);
    // The things that keep a cookie from being worth stealing.
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=Lax");
    // Scoped to the page it unlocks, so renaming the route retires old cookies.
    expect(cookie).toContain("Path=/updates");
  });

  it("never puts the password itself in the cookie", async () => {
    const res = mockRes();
    await handler(post(PASSWORD), res);
    expect(res._out.headers["set-cookie"]).not.toContain(PASSWORD);
  });

  it("refuses the wrong password, and says nothing about how wrong", async () => {
    for (const bad of ["", "deck-pass-2025", "DECK-PASS-2026", "deck-pass-2026 ", null, 42, undefined]) {
      const res = mockRes();
      await handler(post(bad), res);
      expect(res._out.status, String(bad)).toBe(401);
      expect(res._out.headers["set-cookie"], String(bad)).toBeUndefined();
    }
  });

  it("meters the attempt BEFORE it looks at the password", async () => {
    // A login endpoint with no limiter in front of it is a guessing machine.
    const res = mockRes();
    await handler(post("whatever"), res);
    expect(checkRateLimit).toHaveBeenCalledOnce();
    expect(vi.mocked(checkRateLimit).mock.calls[0][1]).toMatchObject({
      bucket: "slides-login", failClosed: true,
    });
  });

  it("turns a rate-limited caller away without checking anything", async () => {
    vi.mocked(checkRateLimit).mockResolvedValueOnce({ ok: false, hits: 11, limit: 10, retryAfter: 900 });
    const res = mockRes();
    await handler(post(PASSWORD), res);
    expect(res._out.status).toBe(429);
    expect(res._out.headers["set-cookie"]).toBeUndefined();
  });

  it("stays shut rather than open when no password is configured", async () => {
    delete process.env.SLIDES_PASSWORD;
    const res = mockRes();
    await handler(post(""), res);
    expect(res._out.status).toBe(500);
    expect(res._out.headers["set-cookie"]).toBeUndefined();
  });

  it("answers anything but POST with 405", async () => {
    const res = mockRes();
    await handler({ method: "GET", headers: {} } as never, res);
    expect(res._out.status).toBe(405);
  });

  it("leaves the reviewer login alone — no scope means the old behaviour", async () => {
    // The two share an endpoint, not a code path: a request without the slides
    // scope must never be answered by the deck password.
    const res = mockRes();
    await handler({ method: "POST", headers: {}, body: { email: "a@b.com", password: PASSWORD } } as never, res);
    expect(res._out.headers["set-cookie"]).toBeUndefined();
    expect([401, 500]).toContain(res._out.status);
  });
});
