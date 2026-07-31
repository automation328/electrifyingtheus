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
