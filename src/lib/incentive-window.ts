// Freshness state for one incentive, derived from the valid_from / valid_to /
// verified_at columns added in migration 0014.
//
// WHY EVERY COMPARISON IS ON ISO STRINGS, NEVER Date OBJECTS:
// a Postgres `date` column arrives as "2026-11-04". `new Date("2026-11-04")`
// parses that as UTC midnight, so anywhere west of Greenwich the program would
// read as ended a day early — the same class of bug that makes the migration
// use `date` rather than `timestamptz` in the first place. String comparison on
// a fixed-width YYYY-MM-DD is exact, ordering-correct and timezone-free.
//
// Every function takes `today` as an argument rather than reading the clock, so
// the behaviour is testable without freezing time.

const ISO = /^\d{4}-\d{2}-\d{2}$/;

const pad = (n: number) => String(n).padStart(2, "0");

/** The reader's LOCAL calendar date. "Is this program open today" is a question
 *  about the date where the reader is standing, not in UTC. */
export function todayIso(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Calendar arithmetic on an ISO date. Done in UTC deliberately: the input is
 *  already a plain calendar date, so UTC is just a fixed frame to count days
 *  in — it never shifts the answer the way parsing a local date would. */
export function isoDaysAgo(today: string, days: number): string {
  if (!ISO.test(today)) return today;
  const [y, m, d] = today.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d) - days * 86_400_000);
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

export type IncentiveWindow =
  | { state: "open" }
  | { state: "upcoming"; date: string }
  | { state: "ended"; date: string };

/** Where a program sits relative to its published window.
 *
 *  A missing or malformed date means "no claim either way" and yields `open`.
 *  We never hide or discredit a program because its metadata is blank — a NULL
 *  valid_to means open-ended, which is the common case, not expired. */
export function incentiveWindow(
  it: { validFrom?: string; validTo?: string },
  today: string,
): IncentiveWindow {
  const from = ISO.test(it.validFrom ?? "") ? it.validFrom! : "";
  const to = ISO.test(it.validTo ?? "") ? it.validTo! : "";
  // valid_to is INCLUSIVE — the last day the program applies — so a program
  // ending today is still open today.
  if (to && to < today) return { state: "ended", date: to };
  if (from && from > today) return { state: "upcoming", date: from };
  return { state: "open" };
}

/** How long a row may go unchecked before the CMS asks someone to look at it. */
export const STALE_AFTER_DAYS = 90;

export type ReviewFlag = { label: string; tone: "red" | "amber" };

/** Editor-facing freshness flag for a site_incentives row, shown in the CMS
 *  list. Takes the raw DB row (snake_case), not the public Incentive shape —
 *  verified_at deliberately never reaches the website.
 *
 *  Returns null when the row needs no attention. */
export function reviewFlag(
  row: { verified_at?: unknown; valid_to?: unknown },
  today: string,
): ReviewFlag | null {
  const verified = typeof row.verified_at === "string" ? row.verified_at : "";
  const validTo = typeof row.valid_to === "string" ? row.valid_to : "";

  // An ended program is the loudest case: it is still on the public page.
  if (ISO.test(validTo) && validTo < today) return { label: "Ended", tone: "red" };
  // Never checked since it was added — the stalest state there is.
  if (!ISO.test(verified)) return { label: "Never verified", tone: "red" };
  if (verified < isoDaysAgo(today, STALE_AFTER_DAYS)) return { label: "Needs review", tone: "amber" };
  return null;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-11-04" → "4 Nov 2026". Splits the string rather than parsing a Date,
 *  for the timezone reason at the top of this file. */
export function formatIsoDate(iso: string): string {
  if (!ISO.test(iso)) return iso;
  const [y, m, d] = iso.split("-");
  return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;
}
