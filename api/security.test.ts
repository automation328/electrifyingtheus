// Regression tests for the security fixes of 27 Nov 2026. Each one pins a
// behaviour that was missing or wrong before; see the finding it names.
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { verifyRecaptcha } from "./_recaptcha";
import { checkRateLimit, checkAuthRateLimit } from "./_rate-limit";
import { sameHttpsHost } from "./events";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

const google = (body: object) => vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body))));

describe("reCAPTCHA check (forms could be scripted)", () => {
  it("passes a good token for the right form on our site", async () => {
    vi.stubEnv("RECAPTCHA_SECRET_KEY", "test-secret");
    google({ success: true, score: 0.9, action: "share_email", hostname: "electrifyingtheus.com" });
    expect((await verifyRecaptcha("t", { action: "share_email" })).ok).toBe(true);
  });

  it("rejects a token minted for a different form", async () => {
    vi.stubEnv("RECAPTCHA_SECRET_KEY", "test-secret");
    google({ success: true, score: 0.9, action: "homepage_contact", hostname: "electrifyingtheus.com" });
    expect((await verifyRecaptcha("t", { action: "share_email" })).ok).toBe(false);
  });

  it("rejects a token solved on another site", async () => {
    vi.stubEnv("RECAPTCHA_SECRET_KEY", "test-secret");
    google({ success: true, score: 0.9, action: "share_email", hostname: "evil.example" });
    expect((await verifyRecaptcha("t", { action: "share_email" })).ok).toBe(false);
  });

  it("rejects a low score and a missing token", async () => {
    vi.stubEnv("RECAPTCHA_SECRET_KEY", "test-secret");
    google({ success: true, score: 0.1 });
    expect((await verifyRecaptcha("t")).ok).toBe(false);
    expect((await verifyRecaptcha("")).ok).toBe(false);
  });

  it("fails closed on a Google outage only when the caller asks", async () => {
    vi.stubEnv("RECAPTCHA_SECRET_KEY", "test-secret");
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("down"); }));
    expect((await verifyRecaptcha("t", { failClosed: true })).ok).toBe(false);
    expect((await verifyRecaptcha("t")).ok).toBe(true);
  });
});

describe("rate limiter with no client IP (sign-in guesses went uncounted)", () => {
  it("refuses a fail-closed sign-in request it cannot attribute", async () => {
    const r = await checkAuthRateLimit({ headers: {} }, { bucket: "gate-login", limit: 10, windowMinutes: 15, failClosed: true });
    expect(r.ok).toBe(false);
  });

  it("still lets an ordinary form request through", async () => {
    const r = await checkRateLimit({ headers: {} }, { bucket: "lead", limit: 20, windowMinutes: 60 });
    expect(r.ok).toBe(true);
  });
});

describe("feed paging (a feed could send the server anywhere)", () => {
  it("follows only same-host https next pages", () => {
    const base = "https://api.eventcalendarapp.com/events?page=1";
    expect(sameHttpsHost("https://api.eventcalendarapp.com/events?page=2", base)).toBe(true);
    expect(sameHttpsHost("http://api.eventcalendarapp.com/events?page=2", base)).toBe(false);
    expect(sameHttpsHost("https://169.254.169.254/latest/meta-data", base)).toBe(false);
    expect(sameHttpsHost("not a url", base)).toBe(false);
  });
});

describe("security headers (vercel.json)", () => {
  const cfg = JSON.parse(readFileSync("vercel.json", "utf8")) as { headers: { source: string; headers: { key: string; value: string }[] }[] };
  const headerFor = (source: string, key: string) =>
    cfg.headers.filter((h) => h.source === source).flatMap((h) => h.headers).find((x) => x.key === key)?.value ?? "";

  it("sends HSTS, nosniff and a strict CSP base on every page", () => {
    expect(headerFor("/(.*)", "Strict-Transport-Security")).toMatch(/max-age=\d{8,}.*includeSubDomains/);
    expect(headerFor("/(.*)", "X-Content-Type-Options")).toBe("nosniff");
    const csp = cfg.headers.flatMap((h) => h.headers).filter((x) => x.key === "Content-Security-Policy").map((x) => x.value);
    expect(csp.length).toBeGreaterThan(0);
    for (const v of csp) {
      expect(v).toContain("object-src 'none'");
      expect(v).toContain("base-uri 'self'");
    }
  });

  it("keeps the CMS out of frames and out of search", () => {
    expect(headerFor("/admin", "X-Frame-Options")).toBe("DENY");
    expect(headerFor("/admin", "Content-Security-Policy")).toContain("frame-ancestors 'none'");
    expect(headerFor("/admin", "X-Robots-Tag")).toContain("noindex");
  });

  it("trials a script policy with no inline or eval in report-only mode", () => {
    const ro = headerFor("/(.*)", "Content-Security-Policy-Report-Only");
    const script = ro.split(";").find((d) => d.trim().startsWith("script-src")) ?? "";
    expect(script).not.toContain("'unsafe-eval'");
    expect(script).not.toContain("'unsafe-inline'");
  });
});

describe("client env access (the whole env object, commit author included, was in the bundle)", () => {
  const files = (dir: string): string[] => readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/.test(f) && !/\.test\./.test(f) ? [p] : [];
  });

  it("reads VITE_ variables as import.meta.env.NAME, never through a cast", () => {
    const offenders = files("src").filter((p) => /\(import\.meta as\b/.test(readFileSync(p, "utf8")));
    expect(offenders).toEqual([]);
  });
});
