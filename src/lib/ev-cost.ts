// =============================================================================
// EV Cost Calculator — pure compute module
//
// Single source of truth for the operating-cost math, per the EV Cost
// Calculator spec §5 (Calculation Methodology). This module is intentionally
// free of React, data fetching, and formatting so it can run identically on the
// client, on a server, and inside the golden-file tests (ev-cost.test.ts).
//
// All formulas mirror the spec exactly:
//   ev_kwh_per_mile = (1 / mpge_combined) * 33.7        // 33.7 kWh per gallon
//   blended_kwh     = home_share*home$ + public_share*public$
//   annual_ev_cost  = miles * ev_kwh_per_mile * blended_kwh * (1 + loss)
//   annual_gas_cost = (miles / mpg) * gas$
//   five_year_ev    = annual_ev_cost*5 - federal - state - utility   (incentives
//                     are a one-time reduction of the multi-year total, never
//                     amortized into the annual/monthly figures)
// =============================================================================

/** kWh in one gallon of gasoline (EPA gallon-gasoline-equivalent). */
export const KWH_PER_GALLON = 33.7;

/** Spec defaults (US, 2026) — §5 "Default assumptions". */
export const DEFAULTS = {
  annualMiles: 13_500, // FHWA US average
  horizonYears: 5, // convention
  // EPA MPGe / kWh-per-100mi are measured at the wall (AC energy drawn to
  // recharge), so charging + onboard-charger losses are ALREADY baked into each
  // vehicle's efficiency figure. Applying an extra loss here would double-count
  // it and overstate EV running cost, so the default is 0. (Users can still add
  // one via the advanced assumptions.)
  chargingLoss: 0,
  publicKwhPrice: 0.43, // national blended DCFC, v1
  /** Home-charging mix: share of energy costed at the home rate. When the driver
   *  charges at home we cost all charging at the residential rate — the standard
   *  industry/EIA approach (e.g. zeta.org's calculator): ~80-90% of charging is
   *  done at home and public-charging price data is limited, so at-home charging
   *  cost is used. The "No home charging" path still uses a public-heavy mix. */
  homeShareWithHome: 1.0, // Home = Yes  → home rate (at-home charging)
  homeShareWithoutHome: 0.3, // Home = No   → 30% home / 70% public
  dollarAmount: 50, // dollar-driving callout
} as const;

export interface VehicleEnergy {
  /** Combined MPG (gas vehicles). */
  mpgCombined?: number;
  /** Combined MPGe (EVs). Preferred EV input — EPA-traceable. */
  mpgeCombined?: number;
  /** Fallback EV efficiency when MPGe is unavailable. */
  kwhPer100mi?: number;
}

export interface EvCostInputs {
  annualMiles: number;
  horizonYears: number;

  // Energy prices
  gasPricePerGallon: number;
  homeKwhPrice: number;
  publicKwhPrice: number;

  // Charging behaviour
  /** 0..1 — fraction of charging done at the home rate. */
  homeChargingShare: number;
  chargingLoss: number;

  // Vehicles
  gas: VehicleEnergy;
  ev: VehicleEnergy;

  // Incentives (one-time, applied to the multi-year EV total only)
  federalCredit: number;
  stateRebate: number;
  utilityRebate: number;

  /** EV purchase price minus gas purchase price; used for break-even. */
  evPricePremium?: number;

  /** Dollars for the "on $X you go N miles" callout. */
  dollarAmount?: number;
}

export interface EvCostResult {
  // Per-mile fuel cost
  gasCostPerMile: number;
  evCostPerMile: number;

  // Annualised fuel cost
  annualGasCost: number;
  annualEvCost: number;
  annualSavings: number; // gas − ev (fuel only)
  monthlySavings: number;

  // Multi-year
  horizonGasCost: number;
  horizonEvFuelCost: number;
  totalIncentives: number;
  /** (gas fuel − ev fuel) + incentives, over the horizon. */
  horizonTotalSaved: number;

  // Dollar-driving
  dollarAmount: number;
  gasRangeOnDollar: number;
  evRangeOnDollar: number;

  // Decision support
  /** Years for fuel savings to repay the EV price premium (null if it never does). */
  breakEvenYears: number | null;

  // Derived energy figures (handy for display + debugging)
  blendedKwhPrice: number;
  evKwhPerMile: number;
}

/** kWh consumed per mile for an EV, preferring MPGe and falling back to kWh/100mi. */
export function evKwhPerMile(ev: VehicleEnergy): number {
  if (ev.mpgeCombined && ev.mpgeCombined > 0) return KWH_PER_GALLON / ev.mpgeCombined;
  if (ev.kwhPer100mi && ev.kwhPer100mi > 0) return ev.kwhPer100mi / 100;
  throw new Error("EV energy requires mpgeCombined or kwhPer100mi");
}

/** The core operating-cost comparison. Pure — same inputs always yield same output. */
export function calculate(inputs: EvCostInputs): EvCostResult {
  const {
    annualMiles, horizonYears, gasPricePerGallon, homeKwhPrice, publicKwhPrice,
    homeChargingShare, chargingLoss, gas, ev,
    federalCredit, stateRebate, utilityRebate,
  } = inputs;

  const dollarAmount = inputs.dollarAmount ?? DEFAULTS.dollarAmount;

  const mpg = gas.mpgCombined;
  if (!mpg || mpg <= 0) throw new Error("Gas vehicle requires a positive mpgCombined");

  const kwhPerMile = evKwhPerMile(ev);
  const publicShare = 1 - homeChargingShare;
  const blendedKwhPrice = homeChargingShare * homeKwhPrice + publicShare * publicKwhPrice;

  const annualGasCost = (annualMiles / mpg) * gasPricePerGallon;
  const annualEvCost = annualMiles * kwhPerMile * blendedKwhPrice * (1 + chargingLoss);

  const gasCostPerMile = annualGasCost / annualMiles;
  const evCostPerMile = annualEvCost / annualMiles;

  const annualSavings = annualGasCost - annualEvCost;
  const monthlySavings = annualSavings / 12;

  const horizonGasCost = annualGasCost * horizonYears;
  const horizonEvFuelCost = annualEvCost * horizonYears;
  const totalIncentives = federalCredit + stateRebate + utilityRebate;
  const horizonTotalSaved = horizonGasCost - horizonEvFuelCost + totalIncentives;

  const gasRangeOnDollar = dollarAmount / gasCostPerMile;
  const evRangeOnDollar = dollarAmount / evCostPerMile;

  let breakEvenYears: number | null = null;
  if (inputs.evPricePremium != null && annualSavings > 0) {
    const netPremium = inputs.evPricePremium - totalIncentives;
    breakEvenYears = netPremium <= 0 ? 0 : netPremium / annualSavings;
  }

  return {
    gasCostPerMile, evCostPerMile,
    annualGasCost, annualEvCost, annualSavings, monthlySavings,
    horizonGasCost, horizonEvFuelCost, totalIncentives, horizonTotalSaved,
    dollarAmount, gasRangeOnDollar, evRangeOnDollar,
    breakEvenYears,
    blendedKwhPrice, evKwhPerMile: kwhPerMile,
  };
}

/**
 * Which of the four ownership outcomes two vehicles are in, and the year their
 * cumulative costs cross.
 *
 * `upfrontDiff` is EV upfront minus gas upfront: positive means the EV costs
 * more to buy. `runDiff` is gas annual running cost minus EV annual running
 * cost: positive means the EV costs less to run. Running cost here is the full
 * one — fuel plus maintenance plus insurance — not fuel alone.
 *
 * The four cases are genuinely different and a UI that collapses them lies in
 * at least one of them:
 *
 *   always     cheaper to buy AND cheaper to run — leads from day one, no crossing
 *   breakeven  dearer to buy, cheaper to run — catches up at `crossing`
 *   overtaken  cheaper to buy, dearer to run — LOSES the lead at `crossing`
 *   never      dearer to buy AND dearer to run — never catches up, no crossing
 *
 * This lived inline in two page components, where nothing could test it, and
 * three of the four cases rendered as "EV leads on total cost from day one" —
 * including `never`, which is its exact opposite.
 */
export type OwnershipVerdict = "always" | "breakeven" | "overtaken" | "never";

export function ownershipOutcome(
  upfrontDiff: number,
  runDiff: number,
): { verdict: OwnershipVerdict; crossing: number | null } {
  const verdict: OwnershipVerdict =
    upfrontDiff <= 0 && runDiff >= 0 ? "always"
    : upfrontDiff <= 0               ? "overtaken"
    : runDiff > 0                    ? "breakeven"
    :                                  "never";
  // Only the two crossing cases have a year to report, and only when the annual
  // gap is non-zero — a zero gap never closes whatever the upfront difference is.
  const crossing =
    (verdict === "breakeven" || verdict === "overtaken") && runDiff !== 0
      ? Math.abs(upfrontDiff) / Math.abs(runDiff)
      : null;
  return { verdict, crossing };
}

/** Home-charging share for a Yes/No answer (§5 default mixes). */
export function homeShareFor(hasHomeCharging: boolean): number {
  return hasHomeCharging ? DEFAULTS.homeShareWithHome : DEFAULTS.homeShareWithoutHome;
}
