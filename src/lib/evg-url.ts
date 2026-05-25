// =============================================================================
// URL <-> calculator state (EV Cost Calculator spec §4 routes + save/share).
//
// The full calculator state is encoded in the query string so a result is a
// permalink that "re-renders identically" (a §12 acceptance criterion) and so
// ?vehicle / ?zip-style deep links work — all without a backend. Advanced
// assumptions are only written when they differ from the defaults, keeping
// casual URLs short while preserving fidelity once a user tweaks anything.
// =============================================================================

export interface CalcState {
  gasId: string;
  /** null → use the recommended closest match for the gas car. */
  evId: string | null;
  stateCode: string;
  homeCharging: boolean;
  annualMiles: number;
  ownershipYears: number;
  gasPrice: number;
  homeKwh: number;
  publicKwh: number;
  chargingLoss: number;
  dollarAmount: number;
}

// Short, stable query-param keys.
const K = {
  gasId: "car",
  evId: "ev",
  stateCode: "state",
  homeCharging: "home",
  annualMiles: "miles",
  ownershipYears: "years",
  gasPrice: "gas",
  homeKwh: "kwh",
  publicKwh: "pub",
  chargingLoss: "loss",
  dollarAmount: "usd",
} as const;

const num = (v: string | null, fallback: number): number => {
  if (v == null || v.trim() === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/** Read calculator state from query params, falling back to `fallback`. */
export function parseCalcState(sp: URLSearchParams, fallback: CalcState): CalcState {
  const home = sp.get(K.homeCharging);
  return {
    gasId: sp.get(K.gasId) ?? fallback.gasId,
    evId: sp.get(K.evId) ?? null,
    stateCode: (sp.get(K.stateCode) ?? fallback.stateCode).toUpperCase(),
    homeCharging: home == null ? fallback.homeCharging : home === "1",
    annualMiles: num(sp.get(K.annualMiles), fallback.annualMiles),
    ownershipYears: num(sp.get(K.ownershipYears), fallback.ownershipYears),
    gasPrice: num(sp.get(K.gasPrice), fallback.gasPrice),
    homeKwh: num(sp.get(K.homeKwh), fallback.homeKwh),
    publicKwh: num(sp.get(K.publicKwh), fallback.publicKwh),
    chargingLoss: num(sp.get(K.chargingLoss), fallback.chargingLoss),
    dollarAmount: num(sp.get(K.dollarAmount), fallback.dollarAmount),
  };
}

/**
 * Serialise state to a flat string map. Scenario-defining fields (car, ev,
 * state, home) are always written; advanced assumptions only when they differ
 * from `defaults`. Preserves any non-calculator params already present (e.g.
 * `embed`) when merged by the caller.
 */
export function serializeCalcState(s: CalcState, defaults: CalcState): Record<string, string> {
  const out: Record<string, string> = {
    [K.gasId]: s.gasId,
    [K.stateCode]: s.stateCode,
    [K.homeCharging]: s.homeCharging ? "1" : "0",
  };
  if (s.evId) out[K.evId] = s.evId;

  const round = (n: number) => String(Math.round(n * 1000) / 1000);
  if (s.annualMiles !== defaults.annualMiles) out[K.annualMiles] = String(s.annualMiles);
  if (s.ownershipYears !== defaults.ownershipYears) out[K.ownershipYears] = String(s.ownershipYears);
  if (s.gasPrice !== defaults.gasPrice) out[K.gasPrice] = round(s.gasPrice);
  if (s.homeKwh !== defaults.homeKwh) out[K.homeKwh] = round(s.homeKwh);
  if (s.publicKwh !== defaults.publicKwh) out[K.publicKwh] = round(s.publicKwh);
  if (s.chargingLoss !== defaults.chargingLoss) out[K.chargingLoss] = round(s.chargingLoss);
  if (s.dollarAmount !== defaults.dollarAmount) out[K.dollarAmount] = String(s.dollarAmount);
  return out;
}
