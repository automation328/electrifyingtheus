import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BLOG_POSTS } from "./blog-posts";

// Every internal link inside a blog post must land on a real page. The site is
// a client-rendered SPA, so a crawler sees none of these links and every bad
// path would answer 200 with a "not found" screen. Checked here instead.

// Static routes, read from App.tsx so a new page needs no edit here.
const app = readFileSync("src/App.tsx", "utf8");
const routes = new Set([...app.matchAll(/<Route path="(\/[^"]*)"/g)].map((m) => m[1]).filter((p) => !p.includes(":")));
const posts = new Set(BLOG_POSTS.map((p) => `/blog/${p.slug}`));

const internalLinks = (md: string): string[] =>
  [...md.matchAll(/\]\((\/[^)\s#?]*)/g)].map((m) => m[1].replace(/\/+$/, "") || "/");

describe("blog internal links", () => {
  it("reads the route table", () => {
    expect(routes.size).toBeGreaterThan(30);
    expect(routes.has("/rebates-incentives")).toBe(true);
  });

  it("every link in every post points at a route or an existing post", () => {
    const broken = BLOG_POSTS.flatMap((p) =>
      internalLinks(p.content)
        .filter((href) => !routes.has(href) && !posts.has(href))
        .map((href) => `${p.slug} -> ${href}`),
    );
    expect(broken).toEqual([]);
  });
});
