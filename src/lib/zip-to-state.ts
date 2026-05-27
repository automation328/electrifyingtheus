// Maps a U.S. ZIP code to its USPS state code using the standard 3-digit ZIP
// prefix (SCF) ranges. Approximate at the prefix level — good enough to preset
// state energy rates from a visitor's ZIP without a full ZCTA dataset.

interface Range {
  min: number;
  max: number;
  st: string;
}

// Inclusive ranges over the first 3 ZIP digits. Ordered, non-overlapping.
const RANGES: Range[] = [
  { min: 10, max: 27, st: "MA" },
  { min: 28, max: 29, st: "RI" },
  { min: 30, max: 38, st: "NH" },
  { min: 39, max: 49, st: "ME" },
  { min: 50, max: 54, st: "VT" },
  { min: 55, max: 55, st: "MA" },
  { min: 56, max: 59, st: "VT" },
  { min: 60, max: 69, st: "CT" },
  { min: 70, max: 89, st: "NJ" },
  { min: 100, max: 149, st: "NY" },
  { min: 150, max: 196, st: "PA" },
  { min: 197, max: 199, st: "DE" },
  { min: 200, max: 205, st: "DC" },
  { min: 206, max: 219, st: "MD" },
  { min: 220, max: 246, st: "VA" },
  { min: 247, max: 268, st: "WV" },
  { min: 270, max: 289, st: "NC" },
  { min: 290, max: 299, st: "SC" },
  { min: 300, max: 319, st: "GA" },
  { min: 320, max: 349, st: "FL" },
  { min: 350, max: 369, st: "AL" },
  { min: 370, max: 385, st: "TN" },
  { min: 386, max: 397, st: "MS" },
  { min: 398, max: 399, st: "GA" },
  { min: 400, max: 427, st: "KY" },
  { min: 430, max: 459, st: "OH" },
  { min: 460, max: 479, st: "IN" },
  { min: 480, max: 499, st: "MI" },
  { min: 500, max: 528, st: "IA" },
  { min: 530, max: 549, st: "WI" },
  { min: 550, max: 567, st: "MN" },
  { min: 570, max: 577, st: "SD" },
  { min: 580, max: 588, st: "ND" },
  { min: 590, max: 599, st: "MT" },
  { min: 600, max: 629, st: "IL" },
  { min: 630, max: 658, st: "MO" },
  { min: 660, max: 679, st: "KS" },
  { min: 680, max: 693, st: "NE" },
  { min: 700, max: 714, st: "LA" },
  { min: 716, max: 729, st: "AR" },
  { min: 730, max: 749, st: "OK" },
  { min: 750, max: 799, st: "TX" },
  { min: 800, max: 816, st: "CO" },
  { min: 820, max: 831, st: "WY" },
  { min: 832, max: 838, st: "ID" },
  { min: 840, max: 847, st: "UT" },
  { min: 850, max: 865, st: "AZ" },
  { min: 870, max: 884, st: "NM" },
  { min: 885, max: 885, st: "TX" },
  { min: 889, max: 898, st: "NV" },
  { min: 900, max: 961, st: "CA" },
  { min: 967, max: 968, st: "HI" },
  { min: 970, max: 979, st: "OR" },
  { min: 980, max: 994, st: "WA" },
  { min: 995, max: 999, st: "AK" },
];

/** USPS state code for a 5-digit ZIP, or null if it can't be resolved. */
export function zipToState(zip: string): string | null {
  const digits = String(zip).replace(/\D/g, "");
  if (digits.length < 3) return null;
  const prefix = Number(digits.slice(0, 3));
  for (const r of RANGES) {
    if (prefix >= r.min && prefix <= r.max) return r.st;
  }
  return null;
}
