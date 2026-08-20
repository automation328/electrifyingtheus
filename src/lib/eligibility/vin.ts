// VIN decoding for the rebate eligibility check.
//
// WHAT THIS BUYS US
// Three of the questions the checker asks are things the applicant has to work out
// about their own car, and two of them decide real money:
//
//   • BEV or plug-in hybrid — $7,500 vs $5,000 on Oregon Charge Ahead
//   • Model year            — Delaware refuses used vehicles over eight model years
//   • Battery capacity      — Oregon's Standard rebate pays $2,000/$1,500 at 10 kWh
//                             or more, and $750 below it
//
// A VIN answers all three from an authoritative source, so the reader stops guessing
// about their own vehicle and the engine stops trusting a guess.
//
// WHY IT RUNS IN THE BROWSER
// NHTSA's vPIC service sends `Access-Control-Allow-Origin: *`, so the page calls it
// directly. That is the privacy-preserving choice as well as the cheap one: the VIN
// never reaches our server, is never persisted, and cannot leak into the CRM. It also
// costs no Vercel function slot.
//
// WHAT IT MUST NEVER DO
// Block. NHTSA publishes no availability guarantee, so every failure path — timeout,
// outage, malformed response, unrecognised VIN — degrades silently back to the
// questions the checker already asks. A decode is an accelerator, never a gate.

import type { Answers, BatteryBand, Fuel, ModelYearBand } from "@/lib/eligibility/rules";

const VPIC = "https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin";

/** Delaware's ceiling: a used vehicle must be this many model years old or newer. */
const DELAWARE_MAX_MODEL_AGE = 8;

/** Oregon's Standard rebate band boundary, in kWh. */
const OREGON_BATTERY_BAND_KWH = 10;

const TIMEOUT_MS = 5000;

/** Structural check before we spend a network call.
 *
 *  A VIN is 17 characters and never contains I, O or Q — they were excluded to avoid
 *  confusion with 1 and 0. This rejects obvious nonsense locally; vPIC does the real
 *  validation, including the check digit. */
export function isPlausibleVin(vin: string): boolean {
  return /^[A-HJ-NPR-Z0-9]{17}$/i.test(String(vin ?? "").trim());
}

export interface VinFacts {
  vin: string;
  /** "2018 Tesla Model 3" — for showing the reader what we matched. */
  label: string;
  fuel: Fuel | null;
  modelYear: number | null;
  batteryKwh: number | null;
  /** vPIC returns a comma-separated code list; "0" means a clean decode. */
  errorCode: string;
}

type VpicRow = { Variable?: string; Value?: string | null };

const num = (v: string | undefined): number | null => {
  if (!v) return null;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

/** Map vPIC's fields onto the powertrain categories the rules engine uses.
 *
 *  Motorcycles are handled cautiously. vPIC gives `Body Class: Motorcycle - Street`
 *  but frequently returns no electrification level for them — a Zero decodes with no
 *  fuel type at all — and Oregon's $375 category is for ZERO-emission motorcycles
 *  specifically. So we only claim "zem" when the record actually says electric.
 *  Otherwise we return null and let the reader answer, which is the honest outcome. */
function toFuel(electrification: string, fuelPrimary: string, bodyClass: string): Fuel | null {
  const electric = /electric/i.test(fuelPrimary) || /^(BEV|PHEV|HEV|FCEV)/i.test(electrification);
  if (/motorcycle/i.test(bodyClass)) return electric ? "zem" : null;
  if (/^BEV/i.test(electrification)) return "bev";
  if (/^PHEV/i.test(electrification)) return "phev";
  return null;
}

/** Decode a VIN. Resolves to null on any failure — never throws, never rejects. */
export async function decodeVin(vin: string, signal?: AbortSignal): Promise<VinFacts | null> {
  const clean = String(vin ?? "").trim().toUpperCase();
  if (!isPlausibleVin(clean)) return null;

  const timer = new AbortController();
  const timeout = setTimeout(() => timer.abort(), TIMEOUT_MS);
  // Abort on either the caller's signal (the reader typed on) or our timeout.
  const onOuterAbort = () => timer.abort();
  signal?.addEventListener("abort", onOuterAbort);

  try {
    const res = await fetch(`${VPIC}/${encodeURIComponent(clean)}?format=json`, {
      signal: timer.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;

    const body = (await res.json()) as { Results?: VpicRow[] };
    const rows = Array.isArray(body?.Results) ? body.Results : [];
    if (!rows.length) return null;

    const f: Record<string, string> = {};
    for (const r of rows) {
      if (r?.Variable && typeof r.Value === "string" && r.Value.trim()) {
        f[r.Variable] = r.Value.trim();
      }
    }

    const errorCode = f["Error Code"] ?? "";
    // 400 means invalid characters — the VIN is not a VIN. Everything else may still
    // carry usable data: a check-digit warning does not make the make and model wrong.
    if (/\b400\b/.test(errorCode)) return null;

    const modelYear = num(f["Model Year"]);
    const bodyClass = f["Body Class"] ?? "";
    const electrification = f["Electrification Level"] ?? "";
    const fuelPrimary = f["Fuel Type - Primary"] ?? "";

    // Nothing identifying came back — treat as no answer rather than a bad one.
    if (modelYear === null && !electrification && !bodyClass) return null;

    const label = [modelYear, f["Make"], f["Model"]].filter(Boolean).join(" ").trim();

    return {
      vin: clean,
      label: label || clean,
      fuel: toFuel(electrification, fuelPrimary, bodyClass),
      modelYear,
      batteryKwh: num(f["Battery Energy (kWh) From"]) ?? num(f["Battery Energy (kWh) To"]),
      errorCode: errorCode || "0",
    };
  } catch {
    // Timeout, offline, CORS change, malformed JSON — all the same to the reader.
    return null;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", onOuterAbort);
  }
}

/** Turn decoded facts into the answers the rules engine consumes.
 *
 *  Only fields the decode actually established are returned, so a partial decode
 *  fills what it can and leaves the rest to be asked. `referenceYear` should be the
 *  purchase year where known, because Delaware's age limit runs from the purchase,
 *  not from today. */
export function vinToAnswers(facts: VinFacts, referenceYear: number): Partial<Answers> {
  const out: Partial<Answers> = {};

  if (facts.fuel) out.fuel = facts.fuel;

  if (facts.modelYear !== null) {
    const band: ModelYearBand =
      facts.modelYear >= referenceYear - DELAWARE_MAX_MODEL_AGE ? "within8" : "older";
    out.modelYear = band;
  }

  if (facts.batteryKwh !== null) {
    const band: BatteryBand = facts.batteryKwh >= OREGON_BATTERY_BAND_KWH ? "over10" : "under10";
    out.batteryBand = band;
  }

  return out;
}

/** The year Delaware's model-year limit should be measured against. */
export function referenceYearFor(purchaseDate: string | null | undefined): number {
  if (typeof purchaseDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(purchaseDate)) {
    return Number(purchaseDate.slice(0, 4));
  }
  return new Date().getFullYear();
}

/** A short, plain sentence describing what the VIN established, for the reader. */
export function describeFacts(facts: VinFacts): string {
  const bits: string[] = [];
  if (facts.fuel === "bev") bits.push("battery electric");
  else if (facts.fuel === "phev") bits.push("plug-in hybrid");
  else if (facts.fuel === "zem") bits.push("electric motorcycle");
  if (facts.batteryKwh !== null) bits.push(`${facts.batteryKwh} kWh battery`);
  return bits.length ? `${facts.label} · ${bits.join(" · ")}` : facts.label;
}
