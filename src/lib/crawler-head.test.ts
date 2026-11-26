import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { injectHead } from "../../crawler-head";

const shell = readFileSync("index.html", "utf8");
const tags = `<title>EV Range Map</title>\n<meta name="description" content="How far">\n<link rel="canonical" href="https://electrifyingtheus.com/range-map">`;

describe("injectHead", () => {
  it("replaces the shell's generic head tags and keeps the app", () => {
    const html = injectHead(shell, tags)!;
    expect(html.match(/<title>/g)).toHaveLength(1);
    expect(html).toContain("<title>EV Range Map</title>");
    expect(html.match(/name="description"/g)).toHaveLength(1);
    expect(html).not.toMatch(/og:title|twitter:title/);
    expect(html).toContain('<div id="root"></div>');
    expect(html).toContain('src="/src/main.tsx"');
    expect(html).toContain('rel="icon"');
  });

  it("refuses something that is not the app shell", () => {
    expect(injectHead("<html><body>gate</body></html>", tags)).toBeNull();
  });
});
