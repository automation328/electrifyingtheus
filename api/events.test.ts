import { describe, it, expect } from "vitest";
import { isSafeFeedUrl } from "./events";

describe("isSafeFeedUrl", () => {
  it("accepts ordinary public https pages", () => {
    expect(isSafeFeedUrl("https://myeva.org/events/123")).toBe(true);
    expect(isSafeFeedUrl("https://8.8.8.8/x")).toBe(true);
  });
  it.each([
    "http://example.org/x",
    "file:///etc/passwd",
    "not a url",
    "https://localhost/x",
    "https://foo.localhost/x",
    "https://metadata.google.internal/x",
    "https://127.0.0.1/x",
    "https://2130706433/x",
    "https://0x7f.1/x",
    "https://10.1.2.3/x",
    "https://172.16.0.1/x",
    "https://192.168.1.1/x",
    "https://169.254.169.254/latest/meta-data",
    "https://0.0.0.0/x",
    "https://[::1]/x",
    "https://[::ffff:127.0.0.1]/x",
  ])("refuses %s", (u) => expect(isSafeFeedUrl(u)).toBe(false));
});
