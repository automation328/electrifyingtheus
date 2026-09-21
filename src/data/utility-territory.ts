// Which electric utility serves a ZIP — enough of it to stop showing people
// rebates they cannot claim.
//
// The incentives page picked programmes by STATE, so a downtown Los Angeles ZIP
// was shown five PG&E rebates and no LADWP ones. PG&E says where it stops, in
// its own words: "from Eureka in the north to Bakersfield in the south". Los
// Angeles is about a hundred miles beyond that.
//
// PG&E's side of it comes from its own published service-area ZIP list (see
// pge-service-zips.ts), which is what makes the municipal carve-outs work:
// Sacramento, Santa Clara, Palo Alto and Alameda sit inside PG&E's footprint
// and are not PG&E customers.
//
// Everything else is deliberately modest. ZIP codes straddle utility
// boundaries, eligibility is really decided by the account on the bill, and a
// ZIP this file cannot place resolves to undefined — which the caller treats as
// "show everything", exactly as the page behaved before.

import { PGE_SERVICE_ZIPS } from "@/data/pge-service-zips";

export type UtilityKey = "pge" | "sce" | "sdge" | "ladwp" | "smud";

export const UTILITY_NAMES: Record<UtilityKey, string> = {
  pge: "Pacific Gas & Electric",
  sce: "Southern California Edison",
  sdge: "San Diego Gas & Electric",
  ladwp: "Los Angeles Department of Water and Power",
  smud: "Sacramento Municipal Utility District",
};

/**
 * ZIPs inside the City of Los Angeles, where LADWP is the electric utility.
 *
 * Deliberately the city core and the clear-cut neighbourhoods rather than every
 * ZIP touching the city limits: several LA-addressed ZIPs are unincorporated
 * county served by Edison — East LA (90022, 90063) most notably — and guessing
 * wrong here is the very mistake this file exists to stop.
 */
const LADWP_ZIPS = new Set([
  // Downtown, Civic Center and the central city
  "90012", "90013", "90014", "90015", "90017", "90021", "90071",
  // Mid-city, Hollywood, Los Feliz, Silver Lake, Echo Park
  "90004", "90005", "90006", "90010", "90019", "90020", "90026", "90027",
  "90028", "90029", "90036", "90038", "90039", "90046", "90068",
  // Westside
  "90024", "90025", "90034", "90035", "90045", "90049", "90064", "90066",
  "90067", "90077", "90272", "90094",
  // Venice, Mar Vista, Playa
  "90291", "90292", "90293",
  // North-east LA
  "90031", "90032", "90041", "90042", "90065",
  // South and harbour
  "90007", "90008", "90016", "90018", "90037", "90043", "90044", "90047",
  "90056", "90062", "90089", "90731", "90732", "90744", "90748", "90710",
  // San Fernando Valley
  "91040", "91042", "91303", "91304", "91306", "91307", "91311", "91316",
  "91324", "91325", "91326", "91330", "91331", "91335", "91340", "91342",
  "91343", "91344", "91345", "91352", "91356", "91364", "91367", "91401",
  "91402", "91403", "91405", "91406", "91411", "91423", "91436", "91601",
  "91602", "91604", "91605", "91606", "91607",
]);

/** Sacramento city ZIPs, where SMUD is the utility rather than PG&E. */
const SMUD_ZIPS = new Set([
  "94203", "94204", "94205", "94207", "94208", "94209", "94211", "94229",
  "94230", "94232", "94234", "94235", "94236", "94237", "94239", "94240",
  "94244", "94245", "94247", "94248", "94249", "94250", "94252", "94254",
  "94256", "94257", "94258", "94259", "94261", "94262", "94263", "94267",
  "94268", "94269", "94271", "94273", "94274", "94277", "94278", "94279",
  "94280", "94282", "94283", "94284", "94285", "94287", "94288", "94289",
  "94290", "94291", "94293", "94294", "94295", "94296", "94297", "94298",
  "94299", "95811", "95814", "95815", "95816", "95817", "95818", "95819",
  "95820", "95821", "95822", "95823", "95824", "95825", "95826", "95827",
  "95828", "95829", "95831", "95832", "95833", "95834", "95835", "95838",
  "95841", "95842", "95864",
]);

const zip3 = (zip: string): number => parseInt(zip.slice(0, 3), 10);

/** Every California ZIP prefix, so "absent from the PG&E list" can be read as
 *  "not PG&E" rather than "not a Californian". */
const IS_CALIFORNIA = (prefix: number) => prefix >= 900 && prefix <= 961;

/** San Diego county prefixes, SDG&E's home ground. Imperial Valley (922) is
 *  IID's and is deliberately left out. */
const SDGE_PREFIX = (prefix: number) => prefix >= 919 && prefix <= 921;

/**
 * The utility we are confident serves this ZIP, or undefined when we are not.
 *
 * Undefined is a real answer here, not a failure: most of California is served
 * by a utility this file does not try to pin down, and a wrong "yes" costs a
 * visitor a wasted application.
 */
export function utilityForZip(zip?: string | null): UtilityKey | undefined {
  const clean = String(zip ?? "").trim();
  if (!/^\d{5}$/.test(clean)) return undefined;
  if (LADWP_ZIPS.has(clean)) return "ladwp";
  if (SMUD_ZIPS.has(clean)) return "smud";
  const prefix = zip3(clean);
  if (SDGE_PREFIX(prefix)) return "sdge";
  return undefined;
}

/**
 * Whether a utility serves a ZIP: true, false, or undefined for "no idea".
 *
 * Only the false answers change what anyone sees. They come from two places —
 * a ZIP we have positively assigned to a different utility, and PG&E's own
 * published southern boundary.
 */
export function utilityServesZip(utility: UtilityKey, zip?: string | null): boolean | undefined {
  const clean = String(zip ?? "").trim();
  if (!/^\d{5}$/.test(clean)) return undefined;

  const known = utilityForZip(clean);
  if (known) return known === utility;

  const prefix = zip3(clean);
  if (utility === "pge") {
    if (PGE_SERVICE_ZIPS.has(clean)) return true;
    // Absent from PG&E's own list, in California: somebody else's customer.
    return IS_CALIFORNIA(prefix) ? false : undefined;
  }
  if (utility === "ladwp" || utility === "smud") return false; // both are single-city utilities
  return undefined;
}

/**
 * The utility whose name is most likely on this ZIP's bill, or undefined.
 *
 * Wider than utilityForZip, which answers only from the ZIPs we have positively
 * assigned: this also accepts PG&E's own service-area filing as an answer. That
 * is good enough to decide what to show FIRST — a ranking, where being wrong
 * costs a scroll — but not to decide what to hide, which is why
 * utilityServesZip keeps its stricter reading.
 */
export function servingUtilityFor(zip?: string | null): UtilityKey | undefined {
  return utilityForZip(zip) ?? (utilityServesZip("pge", zip) === true ? "pge" : undefined);
}
