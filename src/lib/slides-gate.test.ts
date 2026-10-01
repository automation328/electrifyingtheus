import { describe, it, expect } from "vitest";
import {
  SLIDES_COOKIE, slidesToken, timingSafeEqualHex, readCookie, slidesUnlocked,
} from "../../slides-gate";

// The /slides page is shared with people outside the review group, so it has its
// own password. These are the properties that keep it worth having.

describe("the slides unlock cookie", () => {
  it("is a digest, never the password", async () => {
    const token = await slidesToken("hunter2");
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(token).not.toContain("hunter2");
  });

  it("changes when the password changes, so old cookies stop working", async () => {
    expect(await slidesToken("one")).not.toBe(await slidesToken("two"));
  });

  it("is stable for the same password, so a cookie survives a redeploy", async () => {
    expect(await slidesToken("same")).toBe(await slidesToken("same"));
  });
});

describe("unlocking", () => {
  const cookieFor = async (password: string) => `${SLIDES_COOKIE}=${await slidesToken(password)}`;

  it("opens for the right cookie", async () => {
    expect(await slidesUnlocked(await cookieFor("letmein"), "letmein")).toBe(true);
  });

  it("stays shut for the wrong one, a missing one, or junk", async () => {
    expect(await slidesUnlocked(await cookieFor("wrong"), "letmein")).toBe(false);
    expect(await slidesUnlocked("", "letmein")).toBe(false);
    expect(await slidesUnlocked(null, "letmein")).toBe(false);
    expect(await slidesUnlocked(`${SLIDES_COOKIE}=`, "letmein")).toBe(false);
    expect(await slidesUnlocked(`${SLIDES_COOKIE}=not-a-digest`, "letmein")).toBe(false);
  });

  it("stays shut when no password is configured, rather than opening on empty", async () => {
    // A blank SLIDES_PASSWORD must never be something a visitor can match.
    expect(await slidesUnlocked(await cookieFor(""), "")).toBe(false);
  });

  it("reads its own cookie out of a header full of others", async () => {
    const header = `_ga=GA1.1.x; ${SLIDES_COOKIE}=abc123; etu_gate=zzz`;
    expect(readCookie(header, SLIDES_COOKIE)).toBe("abc123");
    expect(readCookie(header, "etu_gate")).toBe("zzz");
    expect(readCookie(header, "absent")).toBe("");
    // A cookie whose NAME merely ends with ours must not be mistaken for it.
    expect(readCookie(`x_${SLIDES_COOKIE}=nope`, SLIDES_COOKIE)).toBe("");
  });
});

describe("the comparison", () => {
  it("matches only identical strings, and never throws on odd input", () => {
    expect(timingSafeEqualHex("abc", "abc")).toBe(true);
    expect(timingSafeEqualHex("abc", "abd")).toBe(false);
    expect(timingSafeEqualHex("abc", "ab")).toBe(false);
    expect(timingSafeEqualHex("", "")).toBe(true);
  });
});
