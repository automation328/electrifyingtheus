// Map a dealer listing's make/model text onto a vehicle in the ETUS catalog.
//
// Why this exists: the listings provider has no fuel-type filter, so we cannot
// ask it for "electric cars near me". We ask for specific models and then verify
// each result here. A listing that does not match a known electrified model is
// DROPPED, never displayed — missing a listing is a bad day, advertising a petrol
// car on an EV advocacy site is a broken promise.
//
// Listing text is messy. The same car arrives as "Mustang Mach-E", "Mach E",
// "MUSTANG MACH-E Premium AWD". So compare on a normalised form and allow the
// catalog name to appear anywhere in the listing text.

import { EV_CATALOG, type EvCatalogEntry } from "../data/ev-catalog.js";

/** Lowercase, drop everything but letters and digits. "Mach-E" == "mach e". */
export function normalizeModelText(text?: string | null): string {
  return String(text ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** The server-safe catalog. Holds electrified vehicles only, so unlike
 *  vehicles.ts there is no petrol car here to accidentally surface. */
function catalogEvs(): EvCatalogEntry[] {
  return EV_CATALOG;
}

/** The model half of a catalog entry. */
function modelOf(v: EvCatalogEntry): string {
  return v.model;
}

/**
 * Distinct model names to send upstream as a comma-separated OR filter.
 * Sorted longest-first is irrelevant here, but uniqueness is not: a duplicated
 * model wastes query length against a provider that caps it.
 */
export function catalogSearchModels(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of catalogEvs()) {
    const model = modelOf(v).replace(/,/g, " ").trim();
    if (!model) continue;
    const key = normalizeModelText(model);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(model);
  }
  return out;
}

/** A short name like "i4" or "2" is a real model but weak evidence on its own,
 *  so it only counts when the listing's make agrees. */
const SHORT_ALIAS = 4;

/**
 * Every string that identifies a catalog vehicle, normalised.
 *
 * Only a model's own name and its hand-curated aliases. This deliberately does
 * NOT generate aliases by dropping leading words: that rule turned the electric
 * BMW "iX xDrive40" into the alias "xDrive40", which matched the PETROL
 * "BMW X5 xDrive40i" and would have listed it on an EV marketplace as electric.
 * Dealers' short forms are real but few, so they are enumerated in ev-catalog.ts
 * where a human can see them.
 *
 * An alias claimed by two different models is dropped rather than guessed at.
 */
function aliasIndex(): Map<string, EvCatalogEntry | null> {
  if (aliasCache) return aliasCache;
  const index = new Map<string, EvCatalogEntry | null>();

  const add = (key: string, v: EvCatalogEntry) => {
    if (!key) return;
    if (index.has(key) && index.get(key) !== v) {
      index.set(key, null); // ambiguous across two models — refuse to guess
      return;
    }
    index.set(key, v);
  };

  for (const v of catalogEvs()) {
    add(normalizeModelText(modelOf(v)), v);
    for (const a of v.aliases ?? []) add(normalizeModelText(a), v);
  }

  aliasCache = index;
  return index;
}
let aliasCache: Map<string, EvCatalogEntry | null> | null = null;

/**
 * Best catalog match for a listing, or null when nothing matches confidently.
 *
 * Longest alias wins, so "Model 3 Performance" beats "Model 3" when the listing
 * names the performance trim, while "Model 3 Long Range" still lands on the base
 * car. Null is a perfectly good answer: unmatched listings are dropped.
 */
export function matchCatalogVehicle(make?: string | null, model?: string | null): EvCatalogEntry | null {
  const makeKey = normalizeModelText(make);
  const modelKey = normalizeModelText(model);
  if (!modelKey) return null;

  // Listings often repeat the make inside the model field ("Ford Mustang Mach-E"),
  // so search the combined text rather than the model alone.
  const haystack = makeKey && !modelKey.startsWith(makeKey) ? makeKey + modelKey : modelKey;

  let best: EvCatalogEntry | null = null;
  let bestLen = 0;

  for (const [alias, v] of aliasIndex()) {
    if (!v) continue; // ambiguous alias
    if (alias.length <= bestLen) continue;
    if (!haystack.includes(alias)) continue;

    // When the listing names a make and the catalog entry's make disagrees, this
    // is a different manufacturer's similarly-named model. Skip it.
    const vMake = normalizeModelText(v.make);
    if (makeKey && vMake && !haystack.includes(vMake)) continue;

    // A very short model name ("i4", "2") is only evidence alongside a matching
    // make. On its own it would match half the catalog.
    if (alias.length < SHORT_ALIAS && !(makeKey && vMake && haystack.includes(vMake))) continue;

    best = v;
    bestLen = alias.length;
  }

  return best;
}
