// Drift guard for the site's icons.
//
// This failure mode is silent, which is why it needs a test rather than a
// convention. The catch-all rewrite in vercel.json sends every unmatched path
// to index.html with a 200, so an icon URL that has no file behind it does NOT
// 404 — it answers with HTML under a .png or .ico URL. Nothing in the build
// complains, the browser tab just quietly shows a default, and the global
// nosniff header stops any consumer recovering from the wrong content type.
//
// It went unnoticed for months: /favicon.ico still held the Lovable scaffold
// logo (an orange-and-blue heart) long after the brand art landed, and that is
// the icon Google was showing beside the site in search results. Nothing
// declared that file, which is exactly how it survived — Google and Safari
// probe the root paths whatever the HTML says.
//
// Files are read as TEXT and image headers parsed by hand on purpose: importing
// the app's modules pulls in Vite "@/assets" imports that don't resolve under
// vitest, and an image library is not worth a dependency for two header reads.

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(__dirname, "../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8").replace(/\r\n/g, "\n");
const publicPath = (url: string) => resolve(root, "public", url.replace(/^\//, "").split("?")[0]);

/** Every href on a <link rel="...icon..."> in a chunk of HTML. */
const declaredIcons = (html: string): string[] =>
  [...html.matchAll(/<link[^>]*rel=["'][^"']*icon[^"']*["'][^>]*>/gi)]
    .map((m) => m[0].match(/href=["']([^"']+)["']/i)?.[1])
    .filter((h): h is string => !!h);

/** PNG width/height straight out of the IHDR chunk. */
const pngSize = (p: string): { w: number; h: number } => {
  const b = readFileSync(p);
  expect(b.subarray(1, 4).toString("ascii")).toBe("PNG");
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
};

/** The square sizes an .ico actually carries (0 in the header means 256). */
const icoSizes = (p: string): number[] => {
  const b = readFileSync(p);
  const count = b.readUInt16LE(4);
  return Array.from({ length: count }, (_, i) => b.readUInt8(6 + i * 16) || 256);
};

describe("every declared icon has a file behind it", () => {
  // A missing one serves HTML with a 200, not a 404 — see the header comment.
  it("index.html", () => {
    const icons = declaredIcons(read("index.html"));
    expect(icons.length).toBeGreaterThan(0);
    for (const href of icons) {
      expect(href.startsWith("/"), `${href} must be root-relative`).toBe(true);
      expect(existsSync(publicPath(href)), `public${href} is declared but missing`).toBe(true);
    }
  });

  it("the HTML middleware serves to crawlers", () => {
    // Crawlers matched by CRAWLER never see index.html. This head is all they
    // get, and it declared no icon at all until the scaffold logo was found.
    const icons = declaredIcons(read("middleware.ts"));
    expect(icons.length).toBeGreaterThan(0);
    for (const href of icons) {
      expect(existsSync(publicPath(href)), `public${href} is declared but missing`).toBe(true);
    }
  });
});

describe("the root paths crawlers probe without being told to", () => {
  // Google and Safari request these whatever the HTML declares, so they have to
  // be right even though nothing links to them.
  it.each(["/favicon.ico", "/apple-touch-icon.png"])("%s exists", (href) => {
    expect(existsSync(publicPath(href))).toBe(true);
  });
});

describe("the icons are usable at the sizes they are shown at", () => {
  it("favicon.png is square and comfortably above Google's floor", () => {
    // Google's live rule, verbatim: "Your favicon must be a square (1:1 aspect
    // ratio) that's at least 8x8px. While the minimum size requirement is
    // 8x8px, we recommend using a favicon that's larger than 48x48px".
    //
    // NOT a multiple of 48. That rule existed until Google rewrote the page on
    // 2024-10-24 and every SEO article still repeats it, which is how it ended
    // up asserted here in the first place. Squareness is the only hard gate on
    // dimensions; the rest is the recommendation.
    const { w, h } = pngSize(publicPath("/favicon.png"));
    expect(w).toBe(h);
    expect(w).toBeGreaterThan(48);
  });

  it("favicon.png is small enough to be an icon, not a full logo file", () => {
    // The old one was 1563x1563 and 138KB: the mark occupied 9% of the canvas,
    // so at 16px it was a smudge. A tight crop is the whole point.
    const { w } = pngSize(publicPath("/favicon.png"));
    expect(w).toBeLessThanOrEqual(512);
    expect(readFileSync(publicPath("/favicon.png")).length).toBeLessThan(60_000);
  });

  it("favicon.ico carries the small sizes browsers actually render", () => {
    const sizes = icoSizes(publicPath("/favicon.ico"));
    for (const s of [16, 32, 48]) expect(sizes).toContain(s);
  });

  it("apple-touch-icon.png is the 180x180 Apple asks for", () => {
    const { w, h } = pngSize(publicPath("/apple-touch-icon.png"));
    expect([w, h]).toEqual([180, 180]);
  });
});
