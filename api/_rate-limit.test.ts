import { describe, it, expect, afterEach } from "vitest";
import { AUTH_PER_MINUTE_DEFAULT, authLimitPerMinute, checkAuthRateLimit } from "./_rate-limit";

const ENV = ["AUTH_RATE_LIMIT_PER_MINUTE", "SUPABASE_URL", "VITE_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"] as const;
const saved = Object.fromEntries(ENV.map((k) => [k, process.env[k]]));

afterEach(() => {
  for (const k of ENV) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe("authLimitPerMinute", () => {
  it("reads AUTH_RATE_LIMIT_PER_MINUTE", () => {
    process.env.AUTH_RATE_LIMIT_PER_MINUTE = "12";
    expect(authLimitPerMinute()).toBe(12);
  });

  it("falls back to the default rather than switching the limit off", () => {
    for (const bad of [undefined, "", "0", "-3", "2.5", "ten", "Infinity"]) {
      if (bad === undefined) delete process.env.AUTH_RATE_LIMIT_PER_MINUTE;
      else process.env.AUTH_RATE_LIMIT_PER_MINUTE = bad;
      expect(authLimitPerMinute(), String(bad)).toBe(AUTH_PER_MINUTE_DEFAULT);
    }
  });
});

describe("checkAuthRateLimit", () => {
  it("checks the per-minute window first, and fails closed when asked", async () => {
    // No database configured, so the first check that runs decides the answer.
    for (const k of ["SUPABASE_URL", "VITE_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]) delete process.env[k];
    process.env.AUTH_RATE_LIMIT_PER_MINUTE = "7";
    const req = { headers: { "x-forwarded-for": "203.0.113.9" } };

    const r = await checkAuthRateLimit(req, { bucket: "gate-login", limit: 10, windowMinutes: 15, failClosed: true });
    expect(r.ok).toBe(false);
    expect(r.limit).toBe(7);
    expect(r.retryAfter).toBeLessThanOrEqual(60);
  });
});
