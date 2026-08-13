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
  /** This collection's live page carries the on-page block builder, so the
   *  editor offers "Edit on page" next to Save. Opt-in: `viewUrl` alone is not
   *  enough — every collection has one, but most of those pages have no
   *  builder, and a button that opened a page you couldn't edit would lie. */
  editOnPage?: boolean;
  /** Optional row field to group the list by (e.g. vehicle type). */
  groupField?: string;
  /** Pretty labels for group values (e.g. { ev: "Electric", gas: "Gas" }). */
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
