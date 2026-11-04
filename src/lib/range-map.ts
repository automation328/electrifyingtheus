// Range Map: how far a car goes on a charge, drawn as circles around a ZIP.
//
// The vehicle list is the EV vs Gas calculator's, so both pages offer the same
// cars. Ranges come from the EPA by-year data (src/data/ev-range-by-year.ts), so
// a 2013 LEAF shows its 75 miles, not the current car's 303. A car with no EPA
// data yet falls back to its catalog range. The circles are straight-line
// distance; the page says so, because road miles run longer.

import { EV_CATALOG, type EvCatalogEntry } from "@/data/ev-catalog";
import { EV_RANGE_VARIANTS, type EpaVariant } from "@/data/ev-range-by-year";
import { getVehiclesByType } from "@/data/vehicles";

export const METERS_PER_MILE = 1609.344;

/** Upper end of the 10–30% cold-weather loss the EVs in Winter page cites. */
export const WINTER_LOSS = 0.3;

const CALCULATOR_EV_IDS = new Set(getVehiclesByType("ev").map((v) => v.id));

/** The EVs the EV vs Gas calculator offers. */
export const RANGE_MODELS: EvCatalogEntry[] = EV_CATALOG.filter((e) => CALCULATOR_EV_IDS.has(e.id));

export const RANGE_MAKES: string[] = [...new Set(RANGE_MODELS.map((e) => e.make))].sort();

export const modelsOf = (make: string): EvCatalogEntry[] =>
  RANGE_MODELS.filter((e) => e.make === make).sort((a, b) => a.model.localeCompare(b.model));

/** Model years with an EPA rating, newest first. Empty for a car with no EPA data. */
export const yearsOf = (id: string): number[] =>
  Object.keys(EV_RANGE_VARIANTS[id] ?? {}).map(Number).sort((a, b) => b - a);

export function variantsOf(id: string, year: number): readonly EpaVariant[] {
  if (EV_RANGE_VARIANTS[id]) return EV_RANGE_VARIANTS[id][year] ?? [];
  const rangeMi = RANGE_MODELS.find((e) => e.id === id)?.rangeMi;
  return rangeMi ? [[rangeMi, ""]] : [];
}

const DRIVE: Record<string, string> = { r: "RWD", f: "FWD", a: "AWD" };

/** "long range", "a" → "Long Range AWD · 330 mi". */
export function variantLabel(v: EpaVariant): string {
  const words = (v[2] ?? "").replace(/\b\w/g, (c) => c.toUpperCase());
  const name = [words, DRIVE[v[1]] ?? ""].filter(Boolean).join(" ") || "Standard";
  return `${name} · ${v[0]} mi`;
}

export interface RangeRings {
  /** One way, mild weather, at this charge. */
  full: number;
  /** One way in deep cold. */
  winter: number;
}

export function rangeRings(epaMiles: number, chargePct: number): RangeRings {
  const full = Math.round(epaMiles * (Math.min(100, Math.max(0, chargePct)) / 100));
  return { full, winter: Math.round(full * (1 - WINTER_LOSS)) };
}

export interface MapPlace {
  lat: number;
  lon: number;
  /** "San Francisco, CA 94103" */
  label: string;
}

/**
 * A ZIP's center, straight from Zippopotam (CORS-open, no key).
 *
 * Browser-side rather than through api/: the project already sits at Vercel
 * Hobby's 12-function cap. Returns null for a ZIP that does not exist; throws
 * when the service cannot be reached, so the page can say which it was.
 */
export async function lookupZip(zip: string, signal?: AbortSignal): Promise<MapPlace | null> {
  if (!/^\d{5}$/.test(zip)) return null;
  const r = await fetch(`https://api.zippopotam.us/us/${zip}`, { signal });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`ZIP lookup failed: ${r.status}`);
  const d = await r.json();
  const p = Array.isArray(d?.places) ? d.places[0] : null;
  const lat = parseFloat(p?.latitude);
  const lon = parseFloat(p?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const city = p?.["place name"];
  const state = p?.["state abbreviation"];
  return { lat, lon, label: city ? `${city}, ${state} ${zip}` : zip };
}

/** A ZIP, city, state or address. Null when nothing matches; throws when the lookup fails. */
export async function lookupPlace(query: string, signal?: AbortSignal): Promise<MapPlace | null> {
  const q = query.trim();
  if (!q) return null;
  if (/^\d{5}$/.test(q)) return lookupZip(q, signal);
  const r = await fetch(`/api/stations?op=geocode&q=${encodeURIComponent(q)}`, { signal });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`Place lookup failed: ${r.status}`);
  return r.json();
}

const postalOf = (d: { postal?: unknown }) => String(d?.postal ?? "").replace(/\D/g, "").slice(0, 5);

/** The visitor's U.S. ZIP from their IP, or "" when it can't be told. Edge headers first, ipapi.co second. */
export async function detectZip(): Promise<string> {
  try {
    const r = await fetch("/api/geo");
    const d = r.ok ? await r.json() : null;
    if (d?.country === "US" && postalOf(d).length === 5) return postalOf(d);
  } catch { /* fall through to the third-party lookup */ }
  try {
    const r = await fetch("https://ipapi.co/json/");
    const d = r.ok ? await r.json() : null;
    if (d?.country_code === "US" && postalOf(d).length === 5) return postalOf(d);
  } catch { /* manual entry */ }
  return "";
}
