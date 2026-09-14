// =============================================================================
// Vehicle matching — surface the right class-matched EV substitutes for a
// shopper's current gas car, in the right order, without them thinking about
// vehicle class (EV Cost Calculator spec §6).
//
// Pure + deterministic. The page passes in the user's gas vehicle and the EV
// catalog; this returns up to three labelled matches:
//   "Closest match" · "Lowest total cost" · "Best overall value"
// =============================================================================

import type { VehicleData, BodyStyle } from "./tco-calculator";
import { calculate, homeShareFor, DEFAULTS } from "./ev-cost";
import { NATIONAL_AVG } from "@/data/state-energy-rates";

export type MatchLabel = "Closest match" | "Lowest total cost" | "Best overall value";

export interface EvMatch {
  ev: VehicleData;
  label: MatchLabel;
  classMatchScore: number;
  costScore: number;
  valueScore: number;
  composite: number;
  fiveYearTotal: number;
  reason: string;
  /** Set when filters had to be relaxed to find a match (spec: rare/discontinued). */
  caveat?: string;
}

/* The federal purchase credit is not modelled anywhere in this app: it ended,
   and ElectricityVsGasoline.tsx and GmEvVsGas.tsx both pass federalCredit: 0 for
   the comparison they display. fiveYearTotal() used to subtract $7,500 from
   every candidate, which cancelled out of the ranking - a uniform shift leaves
   normalize() untouched - but left EvMatch.fiveYearTotal $7,500 below the real
   figure, waiting for the first surface that renders it. */

// Which body styles read as "the same kind of car" for matching purposes.
const ADJACENCY: Record<BodyStyle, BodyStyle[]> = {
  sedan: ["hatchback", "coupe"],
  hatchback: ["sedan", "coupe"],
  coupe: ["sedan", "hatchback"],
  "suv-compact": ["suv-mid"],
  "suv-mid": ["suv-compact", "suv-large"],
  "suv-large": ["suv-mid", "minivan"],
  minivan: ["suv-large"],
  truck: [],
};

const isCar = (b: BodyStyle) => b === "sedan" || b === "hatchback" || b === "coupe";

function bodyRelation(user: BodyStyle, ev: BodyStyle): "same" | "adjacent" | "none" {
  if (user === ev) return "same";
  if (ADJACENCY[user]?.includes(ev)) return "adjacent";
  return "none";
}

/** A 5-year ownership estimate at national-average prices — a fair, fixed yardstick. */
function fiveYearTotal(v: VehicleData): number {
  const res = calculate({
    annualMiles: DEFAULTS.annualMiles,
    horizonYears: 5,
    gasPricePerGallon: NATIONAL_AVG.gasPricePerGallon,
    homeKwhPrice: NATIONAL_AVG.electricityCentsPerKwh / 100,
    publicKwhPrice: DEFAULTS.publicKwhPrice,
    homeChargingShare: homeShareFor(true),
    chargingLoss: DEFAULTS.chargingLoss,
    gas: { mpgCombined: v.type === "gas" ? v.mpg : 99 },
    ev: { mpgeCombined: v.mpge, kwhPer100mi: v.kwhPer100mi ?? 30 },
    federalCredit: 0, stateRebate: 0, utilityRebate: 0,
  });
  const fuel5 = res.annualEvCost * 5; // v is always an EV here
  const maint5 = v.maintenanceCostPerMile * DEFAULTS.annualMiles * 5;
  const ins5 = v.insuranceAnnual * 5;
  const upfront = v.msrp;
  return upfront + fuel5 + maint5 + ins5;
}

function classMatchScore(user: VehicleData, ev: VehicleData): number {
  const ub = user.bodyStyle ?? "sedan";
  const eb = ev.bodyStyle ?? "sedan";
  const rel = bodyRelation(ub, eb);
  if (rel === "none") return 0;

  let score = 100;
  if (rel === "adjacent") score -= 18;

  // Size proximity
  const sizeDiff = Math.abs((user.sizeClass ?? 3) - (ev.sizeClass ?? 3));
  score -= sizeDiff * 14;

  // Don't downgrade family capacity
  const seatGap = (user.seats ?? 5) - (ev.seats ?? 5);
  if (seatGap > 0) score -= seatGap * 22;

  // Drivetrain: AWD/4WD shoppers prefer AWD-capable EVs
  const userAwd = user.drivetrain === "AWD" || user.drivetrain === "4WD";
  const evAwd = ev.drivetrain === "AWD" || ev.drivetrain === "4WD";
  if (userAwd && !evAwd) score -= 8;

  // Positioning affinity — reward a match, penalise pushing a mainstream
  // shopper toward a premium/performance EV they didn't ask for.
  if (user.performance && ev.performance) score += 22;
  else if (ev.performance && !user.performance) score -= 25;
  if (user.luxury && ev.luxury) score += 18;
  else if (ev.luxury && !user.luxury) score -= 25;

  return Math.max(0, Math.min(100, score));
}

/* How many of the shopper's own positioning flags this EV carries.

   classMatchScore already awards +22 for a performance match and +18 for a
   luxury one, but it clamps at 100 - and a mainstream EV matching body style,
   size class, seat count and drivetrain already reaches 100 on its own. The
   bonus has nowhere to go, so a Kia EV6 and an Audi Q6 e-tron tie at 100 for an
   Audi Q5 shopper and the tiebreak decides. That tiebreak used to be the
   composite, which weights cost, so "Closest match" for a Porsche 911 came back
   a Mercedes CLA EV.

   Ranking positioning explicitly keeps the clamp (the score is published as a
   0-100 figure) while making the preference survive a tie. */
function segmentFit(user: VehicleData, ev: VehicleData): number {
  return (user.performance && ev.performance ? 1 : 0) + (user.luxury && ev.luxury ? 1 : 0);
}

function normalize(values: number[], invert = false): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return values.map(() => 100);
  return values.map((v) => {
    const t = (v - min) / (max - min);
    return Math.round((invert ? 1 - t : t) * 100);
  });
}

function rawValue(ev: VehicleData): number {
  const eff = (ev.mpge ?? 100) / 100;
  const range = (ev.rangeMi ?? 280) / 300;
  const price = ev.msrp / 45000;
  return (eff * range) / price; // capability + efficiency per dollar
}

function reasonFor(label: MatchLabel, user: VehicleData, ev: VehicleData): string {
  switch (label) {
    case "Closest match":
      // only claim the segment when the pick actually holds it - where the
      // catalog has no premium or performance EV in the class, it will not
      if (user.performance && ev.performance) return `A performance EV to match your ${user.name}`;
      if (user.luxury && ev.luxury) return `A premium EV in the same class as your ${user.name}`;
      return `Same class as your ${user.name}`;
    case "Lowest total cost": {
      /* With the pre-filter gone this can legitimately be a car from outside the
         shopper's segment, and that is the most useful thing on the card when it
         happens. Say it rather than letting the badge imply the cheapest premium
         EV is the cheapest EV. */
      const stepsOut =
        (!!user.performance && !ev.performance) || (!!user.luxury && !ev.luxury);
      return stepsOut
        ? "Cheapest to own over five years \u2014 outside your car\u2019s segment"
        : "Cheapest to own over five years";
    }
    case "Best overall value":
      return "Best blend of class fit, cost, and capability";
  }
}

export interface RecommendOptions {
  /** Limit results (default 3). */
  limit?: number;
}

/**
 * Recommend EV substitutes for a gas vehicle. Returns up to `limit` distinct
 * EVs, each with one of the three spec labels. Filters by body-style group
 * (trucks only match trucks; cars never match trucks), size ±1, and seat
 * capacity — relaxing progressively (with a caveat) if too few candidates pass.
 */
export function recommendEvs(
  user: VehicleData,
  catalog: VehicleData[],
  options: RecommendOptions = {},
): EvMatch[] {
  const limit = options.limit ?? 3;
  const ub = user.bodyStyle ?? "sedan";
  const userTruck = ub === "truck";

  const evs = catalog.filter((v) => v.type === "ev");

  // Hard gate: keep the same broad family (truck / car / SUV-van).
  const sameFamily = evs.filter((ev) => {
    const eb = ev.bodyStyle ?? "sedan";
    if (userTruck) return eb === "truck";
    if (eb === "truck") return false;
    if (isCar(ub)) return isCar(eb);
    return !isCar(eb); // user is an SUV/minivan → SUV/minivan EVs
  });

  // Progressive relaxation until we have enough candidates.
  const tiers: { sizePass: number; seatSlack: number; caveat?: string }[] = [
    { sizePass: 1, seatSlack: 0 },
    { sizePass: 2, seatSlack: 1, caveat: "Closest available class match" },
    { sizePass: 9, seatSlack: 9, caveat: "Closest available class match" },
  ];

  let candidates: VehicleData[] = [];
  let tierCaveat: string | undefined;
  for (const tier of tiers) {
    candidates = sameFamily.filter((ev) => {
      const sizeOk = Math.abs((user.sizeClass ?? 3) - (ev.sizeClass ?? 3)) <= tier.sizePass;
      const seatsOk = (ev.seats ?? 5) >= (user.seats ?? 5) - tier.seatSlack;
      return sizeOk && seatsOk;
    });
    if (candidates.length >= Math.min(limit, sameFamily.length)) {
      tierCaveat = tier.caveat;
      break;
    }
  }
  if (candidates.length === 0) return [];

  /* Positioning is a PREFERENCE, and classMatchScore already encodes it: +22 for
     a performance match, +18 for a luxury match, and a 25-point penalty for
     pushing a specialist EV on a mainstream shopper. A hard filter here said the
     same thing far more bluntly and did real damage, because it ran before
     scoring and therefore before the cost ranking.

     An Alfa Romeo Giulia is luxury-flagged, so every mainstream EV was dropped
     from the pool and "Cheapest to own over five years" was awarded to the
     cheapest LUXURY car - a Mercedes CLA EV at roughly $65k over five years,
     while a Hyundai IONIQ 6 in the same body style and one size class down came
     in about $11.5k lower and was never in the running. The badge is an
     unqualified superlative; it cannot be true of a subset the reader cannot
     see.

     The score still carries the preference, so the "Closest match" card stays in
     the shopper's own segment. What changes is that the cost and value cards can
     now name something cheaper, and reasonFor() says when the cheapest pick
     steps outside that segment - which is information a buyer wants, not a
     caveat to hide. */

  // Score
  const totals = candidates.map(fiveYearTotal);
  const costScores = normalize(totals, true); // lower cost → higher score
  const valueScores = normalize(candidates.map(rawValue));
  const scored = candidates.map((ev, i) => {
    const classMatch = classMatchScore(user, ev);
    const composite = 0.5 * classMatch + 0.3 * costScores[i] + 0.2 * valueScores[i];
    return { ev, classMatch, segment: segmentFit(user, ev),
             costScore: costScores[i], valueScore: valueScores[i], composite, total: totals[i] };
  });

  // Pick winners for each label, then dedupe, filling from best composite.
  //
  // byCost deliberately sorts on the ROUNDED costScore, not the raw total. Ties
  // are the point: when two EVs cost within a rounding step of each other over
  // five years, the tiebreak takes the better composite, which keeps class fit
  // in play. Sorting on the raw total instead answers a Highlander with an EQB
  // that happens to be $127 cheaper and seats the family far worse.
  // classMatch, then the shopper's own segment, then the composite. Without the
  // middle key every perfect-fitting mainstream EV ties a premium one at 100 and
  // the cost-weighted composite breaks it the wrong way.
  const byClass = [...scored].sort((a, b) =>
    b.classMatch - a.classMatch || b.segment - a.segment || b.composite - a.composite);
  const byCost = [...scored].sort((a, b) => b.costScore - a.costScore || b.composite - a.composite);
  const byComposite = [...scored].sort((a, b) => b.composite - a.composite);

  const order: { pick: typeof scored[number]; label: MatchLabel }[] = [
    { pick: byClass[0], label: "Closest match" },
    { pick: byCost[0], label: "Lowest total cost" },
    { pick: byComposite[0], label: "Best overall value" },
  ];

  // Choose the three vehicles. Collisions fall back to the best composite, which
  // keeps class fit in the running -- falling back within the cost ordering alone
  // would answer a Highlander with whatever cheap EV sits lowest in the list,
  // regardless of whether it seats the family.
  const used = new Set<string>();
  const picked: { pick: typeof scored[number]; label: MatchLabel }[] = [];
  for (const { pick, label } of order) {
    let chosen = pick;
    if (used.has(chosen.ev.id)) {
      chosen = byComposite.find((s) => !used.has(s.ev.id)) ?? chosen;
    }
    if (!chosen || used.has(chosen.ev.id)) continue;
    used.add(chosen.ev.id);
    picked.push({ pick: chosen, label });
    if (picked.length >= limit) break;
  }

  // Make each label true OF THE CARDS ACTUALLY SHOWN. The three sit side by side
  // with their five-year totals on them, so "Lowest total cost" has to be the
  // cheapest of the three. One EV can win on both class fit and cost; when that
  // happened, it took "Closest match" and the cost badge fell to a runner-up,
  // putting a visibly cheaper car next to the one claiming to be cheapest.
  const cheapest = [...picked].sort((a, b) => a.pick.total - b.pick.total)[0];
  const rest = picked.filter((p) => p !== cheapest);
  const closest = [...rest].sort((a, b) =>
    b.pick.classMatch - a.pick.classMatch || b.pick.segment - a.pick.segment)[0];
  const labelled: { pick: typeof scored[number]; label: MatchLabel }[] = [];
  if (closest) labelled.push({ pick: closest.pick, label: "Closest match" });
  if (cheapest) labelled.push({ pick: cheapest.pick, label: "Lowest total cost" });
  for (const p of rest) {
    if (p !== closest) labelled.push({ pick: p.pick, label: "Best overall value" });
  }

  return labelled.map(({ pick, label }) => ({
    ev: pick.ev, label,
    classMatchScore: Math.round(pick.classMatch),
    costScore: pick.costScore,
    valueScore: pick.valueScore,
    composite: Math.round(pick.composite),
    fiveYearTotal: Math.round(pick.total),
    reason: reasonFor(label, user, pick.ev),
    caveat: tierCaveat,
  }));
}
