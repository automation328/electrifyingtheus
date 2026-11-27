import { describe, expect, it } from "vitest";
import { gateEmails, signGateCookie, verifyGateCookie } from "../../gate-cookie";

const SECRET = "gate-secret";
const NOW = 1_800_000_000_000;

describe("gate cookie", () => {
  it("round-trips a reviewer's cookie", async () => {
    const v = await signGateCookie(SECRET, "Ana@Example.com", NOW + 1000);
    expect(await verifyGateCookie(SECRET, v, NOW)).toBe("ana@example.com");
  });

  it("rejects an expired cookie", async () => {
    const v = await signGateCookie(SECRET, "ana@example.com", NOW - 1);
    expect(await verifyGateCookie(SECRET, v, NOW)).toBeNull();
  });

  it("rejects a cookie signed with another secret, or edited to another person", async () => {
    const v = await signGateCookie("other", "ana@example.com", NOW + 1000);
    expect(await verifyGateCookie(SECRET, v, NOW)).toBeNull();
    const good = await signGateCookie(SECRET, "ana@example.com", NOW + 1000);
    const [, exp, sig] = good.split(".");
    const forged = `${btoa("boss@example.com").replace(/=+$/, "")}.${exp}.${sig}`;
    expect(await verifyGateCookie(SECRET, forged, NOW)).toBeNull();
  });

  it("stops working once the reviewer is removed from the list", async () => {
    const v = await signGateCookie(SECRET, "ana@example.com", NOW + 1000);
    expect(await verifyGateCookie(SECRET, v, NOW, new Set(["bo@example.com"]))).toBeNull();
    expect(await verifyGateCookie(SECRET, v, NOW, new Set(["ana@example.com"]))).toBe("ana@example.com");
  });

  it("does not accept the old shared-token cookie", async () => {
    expect(await verifyGateCookie(SECRET, SECRET, NOW)).toBeNull();
  });

  it("reads reviewer emails from the same env vars as the login", () => {
    const set = gateEmails({
      GATE_USERS: JSON.stringify([{ email: "A@x.com", password: "p" }]),
      GATE_USERS_EXTRA: "not json",
      SITE_EMAIL: "site@x.com",
    });
    expect([...set].sort()).toEqual(["a@x.com", "site@x.com"]);
  });
});
