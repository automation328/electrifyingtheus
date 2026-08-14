// Editing an incentive card in place on /rebates-incentives.
//
// Incentives differ from blog posts and events in two ways, and those two
// differences decide this whole module:
//
//  1. ONE PAGE, MANY RECORDS. A blog post's page edits one row, so
//     InlinePageEditor's `fields` target is a single table + id. The Rebates &
//     Incentives page shows dozens of programs drawn from five buckets, so each
//     card has to save its own site_incentives row. Edits are therefore grouped
//     per card, keyed by which program they belong to.
//
//  2. THE NAME IS THE IDENTITY. applyIncentiveOverrides matches a DB row to a
//     curated program by `name` within its bucket (data/incentives.ts). Rename a
//     curated program and the overlay finds no match, so it APPENDS the new name
//     while the curated original stays put — one program, two cards. Every
//     rename therefore also writes a hidden tombstone for the original name.
//     Removals run before additions in that merge, so the tombstone wins.

import {
  FEDERAL, STATE_INCENTIVES, UTILITY_INCENTIVES,
  type CatKey, type Incentive, type IncentiveOverride,
} from "@/data/incentives";

export type IncentiveScope = "federal" | "state" | "utility";

/** Which bucket a program lives in, plus the name the overlay matches on. */
export interface IncentiveTarget {
  scope: IncentiveScope;
  state: string | null;
  category: CatKey | null;
  /** The name BEFORE this edit — the overlay's match key, not the new text. */
  name: string;
}

/** A site_incentives row as the admin API returns it. */
export interface IncentiveRow {
  id: string;
  scope: string;
  state: string | null;
  category: string | null;
  name: string;
  jurisdiction: string | null;
  amount: string | null;
  income: boolean | null;
  used: boolean | null;
  description: string | null;
  link: string | null;
  hidden: boolean | null;
  status: string;
}

/** One row to write: `id` present → UPDATE, absent → INSERT. */
export interface IncentiveWrite {
  id?: string;
  row: Record<string, unknown>;
}

export interface IncentivePlan {
  writes: IncentiveWrite[];
  /** The same changes as overlay rows, so the page can merge them locally and
   *  show the saved text without waiting for a reload. */
  overrides: IncentiveOverride[];
}

// ── Card keys ────────────────────────────────────────────────────────────────
// A card's edits live at `fields.<key>.<column>` in the draft. setPath() splits
// that path on ".", so a key carrying a program name would silently nest itself
// into extra objects the moment a name contained a period. "|" is the field
// separator and would break the same way. Both are escaped, injectively, so the
// key is always safe to embed in a dotted path and still parses back exactly.
const esc = (s: string) => s.replace(/~/g, "~t").replace(/\./g, "~d").replace(/\|/g, "~p");
const unesc = (s: string) => s.replace(/~([tdp])/g, (_, c: string) => (c === "d" ? "." : c === "p" ? "|" : "~"));

/** Stable, dot-free key identifying one card's edits inside the draft. */
export function incentiveKey(t: IncentiveTarget): string {
  return [t.scope, t.state ?? "", t.category ?? "", t.name].map(esc).join("|");
}

/** Inverse of incentiveKey. Returns null for anything malformed. */
export function parseIncentiveKey(key: string): IncentiveTarget | null {
  const parts = key.split("|");
  if (parts.length !== 4) return null;
  const [scope, state, category, name] = parts.map(unesc);
  if (scope !== "federal" && scope !== "state" && scope !== "utility") return null;
  if (!name) return null;
  return {
    scope,
    state: state || null,
    category: (category || null) as CatKey | null,
    name,
  };
}

// ── Locating a rendered card ─────────────────────────────────────────────────

/**
 * Which bucket a rendered program came from, resolved by object REFERENCE.
 *
 * incentivesFor() concatenates the state bucket and the federal bucket, so a
 * card cannot tell which it came from by position — and saving a state program
 * back as a federal one would show it in every state at once. Identity is exact;
 * position is a guess.
 */
export function locateIncentive(item: Incentive): IncentiveTarget | null {
  for (const [cat, list] of Object.entries(FEDERAL)) {
    if (list?.includes(item)) return { scope: "federal", state: null, category: cat as CatKey, name: item.name };
  }
  for (const [st, cats] of Object.entries(STATE_INCENTIVES)) {
    for (const [cat, list] of Object.entries(cats)) {
      if (list?.includes(item)) return { scope: "state", state: st, category: cat as CatKey, name: item.name };
    }
  }
  for (const [st, list] of Object.entries(UTILITY_INCENTIVES)) {
    if (list.includes(item)) return { scope: "utility", state: st, category: null, name: item.name };
  }
  return null;
}

function bucketOf(t: IncentiveTarget): Incentive[] | undefined {
  if (t.scope === "federal") return t.category ? FEDERAL[t.category] : undefined;
  if (t.scope === "state") return t.state && t.category ? STATE_INCENTIVES[t.state]?.[t.category] : undefined;
  return t.state ? UTILITY_INCENTIVES[t.state] : undefined;
}

/** The program a target points at, as currently merged (curated + any override). */
export function findIncentive(t: IncentiveTarget): Incentive | undefined {
  return bucketOf(t)?.find((i) => i.name === t.name);
}

// ── Planning the writes ──────────────────────────────────────────────────────

/** "" and null both mean "no value" in these columns; compare them as equal. */
const norm = (v: string | null | undefined): string | null => (v ? v : null);

/**
 * Turn per-card edits into site_incentives writes.
 *
 * Pure, so the duplication rule above can be proved against the real
 * applyIncentiveOverrides rather than asserted in a comment.
 */
export function planIncentiveEdits(
  groups: Record<string, Record<string, string>>,
  rows: IncentiveRow[],
  find: (t: IncentiveTarget) => Incentive | undefined = findIncentive,
): IncentivePlan {
  const writes: IncentiveWrite[] = [];
  const overrides: IncentiveOverride[] = [];

  for (const [key, edits] of Object.entries(groups ?? {})) {
    const t = parseIncentiveKey(key);
    if (!t) continue;
    const current = find(t);
    // The program is gone (curated set changed, or it was hidden since). Writing
    // a row now would resurrect it under a stale bucket — skip instead.
    if (!current) continue;

    const text = (col: string, fallback: string) => {
      const v = edits?.[col];
      return v === undefined ? fallback : v.trim();
    };

    // A blank name would orphan the row from its bucket AND from the CMS list,
    // so an emptied name falls back to the original rather than saving nothing.
    const name = text("name", current.name) || current.name;
    const jurisdiction = text("jurisdiction", current.jurisdiction);
    const description = text("description", current.desc);
    const link = text("link", current.link);
    const amount = text("amount", current.amount ?? "");

    const same = (r: IncentiveRow) =>
      r.scope === t.scope && norm(r.state) === t.state && norm(r.category) === t.category;

    // Tombstones are excluded: a hidden row is a suppression marker, not the
    // program's record, and updating one would un-hide the curated original.
    const existing = rows.find((r) => same(r) && r.name === t.name && !r.hidden);

    writes.push({
      id: existing?.id,
      row: {
        scope: t.scope, state: t.state, category: t.category,
        name, jurisdiction, amount,
        income: !!current.income, used: !!current.used,
        // The column is `description`; the in-memory field is `desc`. Sending
        // `desc` would be silently dropped.
        description, link,
        hidden: false, status: "published",
      },
    });

    const incentive: Incentive = { name, jurisdiction, desc: description, link };
    if (amount) incentive.amount = amount;
    if (current.income) incentive.income = true;
    if (current.used) incentive.used = true;
    overrides.push({ scope: t.scope, state: t.state, category: t.category, hidden: false, incentive });

    if (name !== t.name) {
      // Renaming leaves the curated original sitting in its bucket under the old
      // name, and the overlay appends the new one beside it. The tombstone
      // removes the original — removals run first in applyIncentiveOverrides.
      const tomb = rows.find((r) => same(r) && r.name === t.name && r.hidden);
      writes.push({
        id: tomb?.id,
        row: {
          scope: t.scope, state: t.state, category: t.category,
          name: t.name, hidden: true, status: "published",
          jurisdiction: current.jurisdiction, amount: current.amount ?? "",
          income: !!current.income, used: !!current.used,
          description: current.desc, link: current.link,
        },
      });
      overrides.push({
        scope: t.scope, state: t.state, category: t.category, hidden: true,
        incentive: { ...current, name: t.name },
      });
    }
  }

  return { writes, overrides };
}

export interface IncentiveIo {
  listRows: (table: "site_incentives") => Promise<IncentiveRow[]>;
  insertRow: (table: "site_incentives", row: Record<string, unknown>) => Promise<unknown>;
  updateRow: (table: "site_incentives", id: string, row: Record<string, unknown>) => Promise<unknown>;
  /** Merge what was just saved into the live data, so the card keeps the new
   *  text after the editor closes instead of snapping back to the old one. */
  apply: (overrides: IncentiveOverride[]) => void;
  /** Injected so tests don't depend on the clock. */
  now?: () => string;
}

/** Persist every edited card. Returns how many rows were written. */
export async function saveIncentiveEdits(
  groups: Record<string, Record<string, string>>,
  io: IncentiveIo,
): Promise<number> {
  if (!groups || Object.keys(groups).length === 0) return 0;
  const rows = await io.listRows("site_incentives");
  const plan = planIncentiveEdits(groups, rows);
  const stamp = io.now ?? (() => new Date().toISOString());
  for (const w of plan.writes) {
    const row = { ...w.row, updated_at: stamp() };
    if (w.id) await io.updateRow("site_incentives", w.id, row);
    else await io.insertRow("site_incentives", row);
  }
  if (plan.overrides.length) io.apply(plan.overrides);
  return plan.writes.length;
}
