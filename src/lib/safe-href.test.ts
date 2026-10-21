import { describe, expect, it } from "vitest";
import { isTrustedImageSrc, safeHref } from "./safe-href";

describe("safeHref", () => {
  it("drops script and data schemes", () => {
    expect(safeHref("javascript:alert(1)")).toBe("#");
    expect(safeHref("data:text/html,x")).toBe("#");
    expect(safeHref("//evil.com")).toBe("#");
  });
  it("keeps allowed schemes", () => {
    for (const h of ["https://a.com", "mailto:a@b.c", "tel:1", "/x", "#y"]) expect(safeHref(h)).toBe(h);
  });
});

describe("isTrustedImageSrc", () => {
  it("allows own paths and supabase storage", () => {
    expect(isTrustedImageSrc("/img/a.png")).toBe(true);
    expect(isTrustedImageSrc("https://abc.supabase.co/storage/v1/x.png")).toBe(true);
  });
  it("rejects arbitrary hosts and odd schemes", () => {
    expect(isTrustedImageSrc("https://evil.com/p.gif")).toBe(false);
    expect(isTrustedImageSrc("//evil.com/p.gif")).toBe(false);
    expect(isTrustedImageSrc("http://x.supabase.co/a.png")).toBe(false);
    expect(isTrustedImageSrc("https://supabase.co.evil.com/a.png")).toBe(false);
    expect(isTrustedImageSrc("data:image/png;base64,AA")).toBe(false);
    expect(isTrustedImageSrc("")).toBe(false);
  });
});
