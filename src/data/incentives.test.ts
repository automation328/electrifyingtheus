import { describe, it, expect } from "vitest";
import {
  incentiveHeadline,
  incentivesFor,
  applyIncentiveOverrides,
  STATE_INCENTIVES,
  UTILITY_INCENTIVES,
  type Incentive,
} from "./incentives";

/* ─────────────────────────────────────────────────────────────────────────────
   incentiveHeadline drives the "Typical incentives in X" panel that sits under
   the savings card on the gas-vs-EV pages.

   It used to rank every programme in a state by dollar value and print the
   largest as "Up to $X". In Georgia the largest is a $30,000 cap on commercial
   charger construction, so a private buyer comparing two sedans was shown "Up to
   $30,000" directly beneath a break-even figure that assumes no incentive at
   all — and Georgia's curated set contains no vehicle-purchase programme of any
   kind.
   ───────────────────────────────────────────────────────────────────────────── */
describe("incentiveHeadline", () => {
  it("keeps the commercial cap out of the consumer headline", () => {
    const everyone = incentiveHeadline("GA");
    const consumer = incentiveHeadline("GA", { audience: "consumer" });

    // the programme itself is still in the data, unchanged
    expect(everyone.topAmount).toBe(30_000);
    // but a private buyer is not shown it
    expect(consumer.topAmount).toBe(300);
    expect(consumer.items.map((i) => i.name)).not.toContain("EV Charger Plus Rebate Program");
    expect(consumer.items.map((i) => i.name)).not.toContain("Business EV Charger Rebate");
  });

  it("says when a state has nothing that reduces the price of the car", () => {
    const ga = incentiveHeadline("GA", { audience: "consumer" });
    expect(ga.hasVehicleProgram).toBe(false);
    expect(ga.topVehicleAmount).toBeNull();
  });

  it("reports a vehicle programme where one exists", () => {
    const co = incentiveHeadline("CO", { audience: "consumer" });
    expect(co.hasVehicleProgram).toBe(true);
    expect(co.topVehicleAmount).toBe(3_500);
  });

  it("leaves states with no commercial programmes untouched by the filter", () => {
    const all = incentiveHeadline("CA");
    const consumer = incentiveHeadline("CA", { audience: "consumer" });
    expect(consumer.count).toBe(all.count);
    expect(consumer.topAmount).toBe(all.topAmount);
  });

  it("returns an empty, non-throwing headline for a state with no curated programmes", () => {
    const tx = incentiveHeadline("TX", { audience: "consumer" });
    expect(tx.count).toBe(0);
    expect(tx.topAmount).toBeNull();
    expect(tx.topVehicleAmount).toBeNull();
    expect(tx.hasVehicleProgram).toBe(false);
    expect(tx.items).toEqual([]);
  });

  it("treats an unlabelled programme as claimable by a private buyer", () => {
    // the default has to be "consumer", or adding the field would have silently
    // emptied every panel in the country
    const unlabelled = incentivesFor("CA", "vehicle").filter((i) => i.audience === undefined);
    expect(unlabelled.length).toBeGreaterThan(0);
    const consumer = incentiveHeadline("CA", { audience: "consumer" });
    expect(consumer.items.length).toBeGreaterThan(0);
  });

  it("still dedupes by name", () => {
    const ca = incentiveHeadline("CA", { audience: "consumer" });
    expect(new Set(ca.items.map((i) => i.name)).size).toBe(ca.items.length);
  });

  it("ranks by the largest dollar figure in the amount string", () => {
    const ca = incentiveHeadline("CA", { audience: "consumer" });
    const dollars = (s?: string) =>
      Math.max(0, ...[...(s ?? "").matchAll(/\$\s?([\d,]+)/g)].map((m) => +m[1].replace(/,/g, "")));
    const ranked = ca.items.map((i) => dollars(i.amount));
    expect([...ranked].sort((a, b) => b - a)).toEqual(ranked);
  });
});

/* Every programme whose own description restricts it to businesses, fleets or
   multifamily properties has to carry audience:"business", or it climbs back
   into a consumer headline the next time someone re-baselines the data. */
describe("the business audience flag", () => {
  const commercialWords =
    /\b(commercial|multifamily|businesses|business|fleet operators|workplace accounts|per project)\b/i;

  const everyIncentive = (): Incentive[] => [
    ...Object.values(STATE_INCENTIVES).flatMap((byCat) => Object.values(byCat).flat()),
    ...Object.values(UTILITY_INCENTIVES).flat(),
  ];

  it("marks the Georgia commercial charger programmes", () => {
    const byName = new Map(everyIncentive().map((i) => [i.name, i]));
    for (const name of [
      "EV Charger Plus Rebate Program",
      "Business EV Charger Rebate",
      "Multifamily Property Charging",
      "Make Ready Infrastructure Program",
    ]) {
      expect(byName.get(name)?.audience, name).toBe("business");
    }
  });

  it("never labels a programme business without commercial language to justify it", () => {
    for (const i of everyIncentive()) {
      if (i.audience !== "business") continue;
      expect(commercialWords.test(i.desc + " " + i.name), i.name).toBe(true);
    }
  });
});

/* The Rebates page runs every programme through incentiveWindow() and marks the
   closed ones; this panel did not. A CMS-authored end date therefore took a
   programme off one surface and left it on the other — and because the panel
   ranks by dollar value, an expired programme could still be the headline.

   The curated entries carry no window, so these tests inject one through the
   same CMS overlay the site uses. TX is used throughout because it has no
   curated programmes of its own, so the overlay is the only thing in the bucket
   and the assertions cannot be confused by real data. */
describe("a closed programme leaves the panel", () => {
  const windowed = (name: string, extra: Partial<Incentive>): Incentive => ({
    name,
    jurisdiction: "Test",
    amount: "Up to $9,000",
    desc: "Injected by a test through the CMS overlay.",
    link: "https://example.invalid/",
    ...extra,
  });

  it("drops a programme whose published window has ended", () => {
    applyIncentiveOverrides([
      { scope: "state", state: "TX", category: "vehicle",
        incentive: windowed("TX Ended Programme", { validTo: "2026-01-31" }) },
    ]);
    const after = incentiveHeadline("TX", { audience: "consumer", today: "2026-09-15" });
    expect(after.items.map((i) => i.name)).not.toContain("TX Ended Programme");
    expect(after.topAmount).toBeNull();

    // and it was genuinely open before that date — the filter is the window,
    // not the overlay failing to apply
    const before = incentiveHeadline("TX", { audience: "consumer", today: "2026-01-15" });
    expect(before.items.map((i) => i.name)).toContain("TX Ended Programme");
    expect(before.topAmount).toBe(9_000);
  });

  it("drops a programme that has not opened yet", () => {
    applyIncentiveOverrides([
      { scope: "state", state: "TX", category: "vehicle",
        incentive: windowed("TX Future Programme", { validFrom: "2027-01-01" }) },
    ]);
    expect(
      incentiveHeadline("TX", { audience: "consumer", today: "2026-09-15" })
        .items.map((i) => i.name),
    ).not.toContain("TX Future Programme");
    expect(
      incentiveHeadline("TX", { audience: "consumer", today: "2027-06-01" })
        .items.map((i) => i.name),
    ).toContain("TX Future Programme");
  });

  it("treats a blank window as open, not expired", () => {
    // a NULL valid_to is the common case and means open-ended. Reading it as
    // expired would empty most of the country's panels.
    applyIncentiveOverrides([
      { scope: "state", state: "TX", category: "vehicle",
        incentive: windowed("TX Open-Ended Programme", {}) },
    ]);
    expect(
      incentiveHeadline("TX", { audience: "consumer", today: "2099-12-31" })
        .items.map((i) => i.name),
    ).toContain("TX Open-Ended Programme");
  });

  it("keeps an expired programme out of the vehicle-programme claim too", () => {
    applyIncentiveOverrides([
      { scope: "state", state: "TX", category: "vehicle", hidden: true,
        incentive: windowed("TX Open-Ended Programme", {}) },
      { scope: "state", state: "TX", category: "vehicle", hidden: true,
        incentive: windowed("TX Future Programme", {}) },
      { scope: "state", state: "TX", category: "vehicle", hidden: true,
        incentive: windowed("TX Ended Programme", {}) },
      { scope: "state", state: "TX", category: "vehicle",
        incentive: windowed("TX Closed Vehicle Rebate", { validTo: "2025-12-31" }) },
    ]);
    const h = incentiveHeadline("TX", { audience: "consumer", today: "2026-09-15" });
    expect(h.hasVehicleProgram).toBe(false);
    expect(h.topVehicleAmount).toBeNull();
  });
});
