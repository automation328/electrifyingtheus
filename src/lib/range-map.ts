// Range Map: how far a car goes on a charge, drawn as circles around a ZIP.
//
// Vehicles come from the EPA by-year data (src/data/ev-range-by-year.ts), so a
// 2013 LEAF shows its 75 miles, not the current car's 303. The circles are
// straight-line distance; the page says so, because road miles run longer.

import { EV_CATALOG, type EvCatalogEntry } from "@/data/ev-catalog";
import { EV_RANGE_VARIANTS, type EpaVariant } from "@/data/ev-range-by-year";

export const METERS_PER_MILE = 1609.344;

/** Upper end of the 10–30% cold-weather loss the EVs in Winter page cites. */
export const WINTER_LOSS = 0.3;

/** Catalog cars we hold EPA range figures for. */
export const RANGE_MODELS: EvCatalogEntry[] = EV_CATALOG.filter((e) => EV_RANGE_VARIANTS[e.id]);

export const RANGE_MAKES: string[] = [...new Set(RANGE_MODELS.map((e) => e.make))].sort();

export const modelsOf = (make: string): EvCatalogEntry[] =>
  RANGE_MODELS.filter((e) => e.make === make).sort((a, b) => a.model.localeCompare(b.model));

/** Model years with an EPA rating, newest first. */
export const yearsOf = (id: string): number[] =>
  Object.keys(EV_RANGE_VARIANTS[id] ?? {}).map(Number).sort((a, b) => b - a);

export const variantsOf = (id: string, year: number): readonly EpaVariant[] =>
  EV_RANGE_VARIANTS[id]?.[year] ?? [];

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

export interface ZipPlace {
  zip: string;
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
export async function lookupZip(zip: string, signal?: AbortSignal): Promise<ZipPlace | null> {
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
  return { zip, lat, lon, label: city ? `${city}, ${state} ${zip}` : zip };
}
