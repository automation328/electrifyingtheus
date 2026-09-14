import { describe, it, expect } from "vitest";
import {
  incentiveHeadline,
  incentivesFor,
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
