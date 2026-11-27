import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchAllNews, newsSlug } from "./news-feed";

afterEach(() => vi.unstubAllGlobals());

describe("news feed", () => {
  it("gives each story a stable on-site slug, distinct per publisher", () => {
    expect(newsSlug("Electrek", "Tesla cuts Model Y price!")).toBe("electrek-tesla-cuts-model-y-price");
    expect(newsSlug("InsideEVs", "Tesla cuts Model Y price!")).not.toBe(newsSlug("Electrek", "Tesla cuts Model Y price!"));
  });

  it("keeps only http(s) stories, short excerpts, and one item per slug", async () => {
    const long = "<p>" + "word ".repeat(200) + "</p>";
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      status: "ok",
      items: [
        { title: "A", link: "https://x.test/a", pubDate: "2026-11-27", description: long },
        { title: "A", link: "https://x.test/a2", pubDate: "2026-11-26" },
        { title: "B", link: "javascript:alert(1)", pubDate: "2026-11-25" },
      ],
    }))));
    const items = await fetchAllNews();
    // Three feeds return the same body: each publisher keeps its own "A".
    expect(items.map((i) => i.slug).sort()).toEqual(["electrek-a", "electrive-a", "insideevs-a"]);
    expect(items[0].excerpt.length).toBeLessThanOrEqual(281);
    expect(items.every((i) => i.link.startsWith("https://"))).toBe(true);
  });
});
