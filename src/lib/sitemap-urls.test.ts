// Drift guard for sitemap-urls.ts.
//
// The URL list is hand-written, which is exactly how og-data.ts went stale. This
// test fails the moment a route or slug is added to the app without being added
// to (or explicitly excluded from) the sitemap, so the sitemap cannot silently
// stop covering the site.
//
// Source files are read as TEXT on purpose: importing src/data/events.ts would
// pull in Vite "@/assets" image imports, which don't resolve under vitest.

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  SITEMAP_STATIC, SITEMAP_BLOG, SITEMAP_EVENTS,
  SITEMAP_REDIRECTS, SITEMAP_EXCLUDE, isSitemapExcluded,
} from "../../sitemap-urls";

const root = resolve(__dirname, "../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8").replace(/\r\n/g, "\n");

const routeLiterals = (): string[] => {
  const app = read("src/App.tsx");
  return [...app.matchAll(/<Route\s+path="(\/[^"]*)"/g)]
    .map((m) => m[1])
    .filter((p) => !p.includes(":") && !p.includes("*"));
};

const slugsIn = (file: string, prefix: string): string[] => {
  const src = read(file);
  return [...new Set([...src.matchAll(/^\s*slug:\s*"([^"]+)"/gm)].map((m) => prefix + m[1]))];
};

describe("sitemap URL inventory", () => {
  it("covers every static route in App.tsx, or explicitly excludes it", () => {
    const missing = routeLiterals().filter(
      (p) => !SITEMAP_STATIC.includes(p) && !isSitemapExcluded(p),
    );
    expect(missing, `add these to SITEMAP_PAGES or SITEMAP_EXCLUDE/SITEMAP_REDIRECTS: ${missing.join(", ")}`).toEqual([]);
  });

  it("covers every curated blog slug", () => {
    const missing = slugsIn("src/data/blog-posts.ts", "/blog/").filter((p) => !SITEMAP_BLOG.includes(p));
    expect(missing, `add to SITEMAP_BLOG: ${missing.join(", ")}`).toEqual([]);
  });

  it("covers every curated event slug, unless its page redirects", () => {
    // A retired event whose registration page now redirects (e.g.
    // /events/from-pump-to-plug → the recording) belongs in SITEMAP_REDIRECTS,
    // not the index — same allowance the static-route test above makes.
    const missing = slugsIn("src/data/events.ts", "/events/")
      .filter((p) => !SITEMAP_EVENTS.includes(p) && !isSitemapExcluded(p));
    expect(missing, `add to SITEMAP_EVENTS or SITEMAP_REDIRECTS: ${missing.join(", ")}`).toEqual([]);
  });

  it("never lists a redirect or an excluded path", () => {
    const bad = SITEMAP_STATIC.filter((p) => isSitemapExcluded(p));
    expect(bad, `these are redirects/noindex and must not be in the sitemap: ${bad.join(", ")}`).toEqual([]);
  });

  it("lists no admin or thank-you URL", () => {
    expect(SITEMAP_STATIC.filter((p) => p.startsWith("/admin") || p.startsWith("/thank-you"))).toEqual([]);
  });

  it("has no duplicates and only root-relative paths", () => {
    expect(SITEMAP_STATIC.length).toBe(new Set(SITEMAP_STATIC).size);
    expect(SITEMAP_STATIC.filter((p) => !p.startsWith("/"))).toEqual([]);
  });

  it("every redirect source is still a real route", () => {
    const routes = routeLiterals();
    const orphaned = SITEMAP_REDIRECTS.filter((p) => !routes.includes(p));
    expect(orphaned, `redirect no longer exists in App.tsx: ${orphaned.join(", ")}`).toEqual([]);
  });

  it("exposes a non-trivial number of URLs", () => {
    // Guards against an accidental empty/truncated list shipping silently.
    expect(SITEMAP_STATIC.length).toBeGreaterThanOrEqual(60);
  });

  it("SITEMAP_EXCLUDE entries are prefixes, not slugs", () => {
    expect(SITEMAP_EXCLUDE.every((p) => p.startsWith("/") && !p.endsWith("/"))).toBe(true);
  });
});
