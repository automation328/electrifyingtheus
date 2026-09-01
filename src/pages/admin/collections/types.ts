// Shared types for the config-driven CMS collection manager. Each collection
// (blog, events, gallery, jobs) is described by a CollectionConfig; the generic
// CollectionManager renders the list + editor from it.

import type { AdminTable } from "@/lib/admin-api";

export type FieldType =
  | "text"
  | "textarea"
  | "markdown"
  | "number"
  | "boolean"
  | "date"
  | "select"
  | "image";

export interface FieldDef {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: { value: string; label: string }[]; // select
  defaultValue?: unknown;
  // Layout hint: "half" fields pair up on wide screens.
  width?: "full" | "half";
}

export interface CollectionConfig {
  table: AdminTable;
  singular: string;
  plural: string;
  /** Row field used as the item title in the list + editor header. */
  titleField: string;
  /** Extra fields shown under the title in the list (small, muted). */
  subtitleFields?: string[];
  /** Field holding the status string (published | draft | archived). */
  statusField: string;
  statusOptions: string[];
  /** Row field holding a thumbnail image URL (shown in the list). */
  imageField?: string;
  /** Column carrying the "remove the matching built-in item" flag — always
   *  "hidden" today (site_events 0016, site_vehicles + site_incentives 0006).
   *  Set it and built-in rows gain a Remove action, which writes a PUBLISHED
   *  row with the flag on. Without it there is no way to delete a curated item,
   *  because the merge re-appends every one that no published row matched.
   *  Leave unset for collections whose curated entries cannot be removed. */
  hiddenField?: string;
  /** Optional extra pill beside the status chip in the list, for a condition
   *  only this collection knows about — incentives use it to flag a row nobody
   *  has checked against the official program page lately. Return null when the
   *  row needs no flag. Built-in (static) rows are never passed through it:
   *  they have no DB columns to judge and no row to fix. */
  rowBadge?: (row: Record<string, unknown>) => { label: string; tone: "red" | "amber" } | null;
  /** This collection's live page carries the on-page block builder, so the
   *  editor offers "Edit on page" next to Save. Opt-in: `viewUrl` alone is not
   *  enough — every collection has one, but most of those pages have no
   *  builder, and a button that opened a page you couldn't edit would lie. */
  editOnPage?: boolean;
  /** Button wording. Blog posts each have their own page, so "Edit on page" is
   *  accurate there. Jobs and incentives do NOT — they are rows on one shared
   *  page — so those say which page they open, rather than implying the button
   *  edits the row you have open. */
  editOnPageLabel?: string;
  /** Optional row field to group the list by (e.g. vehicle type). Each group
   *  renders as its own section with a heading and a count. */
  groupField?: string;
  /** Pretty labels for group values (e.g. { ev: "Electric", gas: "Gas" }).
   *  KEY ORDER IS SECTION ORDER: the gallery lists Videos above Photos here
   *  because the public page does, and a CMS list that disagrees with the page
   *  it edits makes the editor guess. Values with no label here follow, in the
   *  order the rows arrive. */
  groupLabels?: Record<string, string>;
  /** Optional two-column split by a field value (e.g. Electric | Gas). Overrides grouping. */
  splitBy?: { field: string; left: string; leftLabel: string; right: string[]; rightLabel: string };
  /** Built-in (curated) items to show alongside DB rows (the merged view). */
  staticRows?: () => Record<string, unknown>[];
  /** Stable identity for de-duping built-in items against DB overrides. */
  keyOf?: (row: Record<string, unknown>) => string;
  /** One-line description shown under the section title. */
  description?: string;
  /** If set, enables an "Add from library" button that maps a media item to a row. */
  mediaImport?: (m: { name: string; url: string; kind: "image" | "video" | "audio" }) => Record<string, unknown>;
  /** Optional public URL for a row → shows a "View" link that opens the live page. */
  viewUrl?: (row: Record<string, unknown>) => string | undefined;
  fields: FieldDef[];
  /** Optional row → default sort key (desc). Falls back to created_at. */
  sortRows?: (a: Record<string, unknown>, b: Record<string, unknown>) => number;
  /** Numeric column holding display order. Set it to get ↑/↓ buttons on each
   *  row; a move renumbers the whole group rather than swapping two values,
   *  because rows commonly arrive sharing one default (uploads all land on 0)
   *  and swapping equal numbers would leave the order unchanged. */
  orderField?: string;
  /** Reorder only within rows sharing this column's value. The gallery renders
   *  Videos and Photos as separate sections, so moving a photo "up" past a video
   *  would move it nowhere a visitor can see. */
  orderGroupBy?: string;
  /** Pills that narrow the list to one column value, under the Live/Draft tabs.
   *  Separate from those tabs because they answer a different question: those
   *  say whether a row is on the site, these say what kind of thing it is. */
  filterTabs?: { field: string; allLabel: string; options: { value: string; label: string }[] };
}

/**
 * Move `from` to `to` within one group and return only the rows whose order
 * value actually changes.
 *
 * The group is RENUMBERED rather than having two values swapped. Rows commonly
 * share a default — every gallery upload lands on sort 0 — and swapping 0 for 0
 * writes nothing, so the row would appear to move and then snap back on refresh.
 * Renumbering also repairs those ties permanently, on the first move.
 *
 * Returns an empty list for a no-op move (either end of the group) so callers
 * can skip the round trip.
 */
export function reorderWrites(
  peers: Record<string, unknown>[],
  field: string,
  from: number,
  to: number,
): { row: Record<string, unknown>; value: number }[] {
  if (from < 0 || to < 0 || from >= peers.length || to >= peers.length || from === to) return [];
  const next = [...peers];
  [next[from], next[to]] = [next[to], next[from]];
  return next
    .map((row, value) => ({ row, value }))
    .filter(({ row, value }) => Number(row[field] ?? 0) !== value);
}

/** Blank record seeded from a config's field defaults. */
export function emptyRecord(config: CollectionConfig): Record<string, unknown> {
  const rec: Record<string, unknown> = {};
  for (const f of config.fields) {
    rec[f.name] =
      f.defaultValue !== undefined
        ? f.defaultValue
        : f.type === "boolean"
          ? false
          : f.type === "number"
            ? 0
            : "";
  }
  rec[config.statusField] = config.statusOptions[0];
  return rec;
}
