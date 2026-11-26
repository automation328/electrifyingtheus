import { describe, expect, it } from "vitest";
import { cleanHtml } from "./BlockView";

describe("CMS html block sanitizer", () => {
  it("strips script, handlers and javascript: links", () => {
    const out = cleanHtml('<p onclick="x()">hi</p><script>alert(1)</script><a href="javascript:alert(1)">x</a>');
    expect(out).not.toMatch(/script|onclick|javascript:/i);
    expect(out).toContain("<p>hi</p>");
  });

  it("strips fake sign-in forms and page-wide styles", () => {
    const out = cleanHtml('<form action="https://evil.example"><input name="password"><button>Sign in</button></form><style>body{display:none}</style><b>ok</b>');
    expect(out).not.toMatch(/<form|<input|<button|<style/i);
    expect(out).toContain("<b>ok</b>");
  });
});
