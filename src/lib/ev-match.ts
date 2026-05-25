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

const FEDERAL_INCENTIVE = 7500;

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
    federalCredit: FEDERAL_INCENTIVE, stateRebate: 0, utilityRebate: 0,
  });
  const fuel5 = res.annualEvCost * 5; // v is always an EV here
  const maint5 = v.maintenanceCostPerMile * DEFAULTS.annualMiles * 5;
  const ins5 = v.insuranceAnnual * 5;
  const upfront = v.msrp - FEDERAL_INCENTIVE;
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
      if (user.performance) return `A performance EV to match your ${user.name}`;
      if (user.luxury) return `A premium EV in the same class as your ${user.name}`;
      return `Same class as your ${user.name}`;
    case "Lowest total cost":
      return "Cheapest to own over five years";
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

  // Performance / luxury shoppers: if matching specialist EVs exist, prefer them.
  if (user.performance && candidates.some((c) => c.performance)) {
    candidates = candidates.filter((c) => c.performance);
  } else if (user.luxury && candidates.some((c) => c.luxury)) {
    candidates = candidates.filter((c) => c.luxury);
  }

  // Score
  const totals = candidates.map(fiveYearTotal);
  const costScores = normalize(totals, true); // lower cost → higher score
  const valueScores = normalize(candidates.map(rawValue));
  const scored = candidates.map((ev, i) => {
    const classMatch = classMatchScore(user, ev);
    const composite = 0.5 * classMatch + 0.3 * costScores[i] + 0.2 * valueScores[i];
    return { ev, classMatch, costScore: costScores[i], valueScore: valueScores[i], composite, total: totals[i] };
  });

  // Pick winners for each label, then dedupe, filling from best composite.
  const byClass = [...scored].sort((a, b) => b.classMatch - a.classMatch || b.composite - a.composite);
  const byCost = [...scored].sort((a, b) => b.costScore - a.costScore || b.composite - a.composite);
  const byComposite = [...scored].sort((a, b) => b.composite - a.composite);

  const order: { pick: typeof scored[number]; label: MatchLabel }[] = [
    { pick: byClass[0], label: "Closest match" },
    { pick: byCost[0], label: "Lowest total cost" },
    { pick: byComposite[0], label: "Best overall value" },
  ];

  const used = new Set<string>();
  const result: EvMatch[] = [];
  for (const { pick, label } of order) {
    let chosen = pick;
    if (used.has(chosen.ev.id)) {
      chosen = byComposite.find((s) => !used.has(s.ev.id)) ?? chosen;
    }
    if (!chosen || used.has(chosen.ev.id)) continue;
    used.add(chosen.ev.id);
    result.push({
      ev: chosen.ev, label,
      classMatchScore: Math.round(chosen.classMatch),
      costScore: chosen.costScore,
      valueScore: chosen.valueScore,
      composite: Math.round(chosen.composite),
      fiveYearTotal: Math.round(chosen.total),
      reason: reasonFor(label, user, chosen.ev),
      caveat: tierCaveat,
    });
    if (result.length >= limit) break;
  }

  return result;
}
