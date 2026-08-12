// Shared state for WordPress-style on-page editing. EditableContentPage provides
// this context in edit mode; the Editable / EditableImage components below read
// it to turn text and images into inline-editable elements that write back into
// the working override (a deep clone of the page's current effective content).

import { createContext, useContext } from "react";
import type { PageBlock, BlockType } from "@/lib/page-content";

export interface InlineEditContextValue {
  /** True while the page is in edit mode. */
  editing: boolean;
  /** Id of the block currently selected in the editor (its settings show in the
   *  left Inspector). null when nothing is selected. */
  activeId: string | null;
  /** Select a block (or null to clear) — used by block click + the Layers panel. */
  setActive: (id: string | null) => void;
  /** Set a value at a dotted path in the working override (e.g. "sections.0.body.1"). */
  set: (path: string, value: unknown) => void;
  /** Commit several top-level override fields at once (a single undo step).
   *  Optional — provided by the page-level editor, not by container child ctx. */
  setMany?: (patch: Record<string, unknown>) => void;
  /** Read the current value at a dotted path (for image controls). */
  get: (path: string) => unknown;
  // ── Builder blocks ──────────────────────────────────────────────
  /** Add a new block of `type` at insertion slot `slot`. */
  addBlock: (slot: string, type: BlockType) => void;
  /** Patch a block by id. */
  updateBlock: (id: string, patch: Partial<PageBlock>) => void;
  /** Move a block up/down among the blocks sharing its slot. */
  moveBlock: (id: string, dir: -1 | 1) => void;
  /** Duplicate a block (inserted right after the original). */
  duplicateBlock: (id: string) => void;
  /** Move a dragged block before/after a target block (drag-and-drop reorder). */
  moveBlockRelative: (dragId: string, targetId: string, before: boolean) => void;
  /** Remove a block by id. */
  removeBlock: (id: string) => void;
  /** Save a block as a reusable template (shared across pages). */
  saveTemplate: (block: PageBlock, name: string) => void;
  /** Insert a saved template's block at a slot. */
  insertTemplate: (slot: string, block: PageBlock) => void;
  /** Delete a saved template by id. */
  deleteTemplate: (id: string) => void;
}

/** `activeId` value that selects the PAGE HERO rather than a builder block. The
 *  hero isn't a block (it's the page's own header), but it uses the same
 *  selection + Inspector-portal machinery, so it needs an id no block can have.
 *  Lives here — not in Inspector or HeroSection — so those two can both read it
 *  without importing each other. */
export const HERO_ID = "__page-hero__";

export const InlineEditContext = createContext<InlineEditContextValue | null>(null);

/** Null outside an editable page (or when not editing) → components render plain. */
export function useInlineEdit(): InlineEditContextValue | null {
  return useContext(InlineEditContext);
}

/** Immutably set `value` at a dotted path, creating arrays/objects as needed. */
export function setPath<T extends object>(root: T, path: string, value: unknown): T {
  const parts = path.split(".");
  const clone: any = Array.isArray(root) ? [...(root as unknown[])] : { ...root };
  let cur = clone;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const nextIsIndex = /^\d+$/.test(parts[i + 1]);
    const existing = cur[key];
    cur[key] = existing == null ? (nextIsIndex ? [] : {}) : Array.isArray(existing) ? [...existing] : { ...existing };
    cur = cur[key];
  }
  cur[parts[parts.length - 1]] = value;
  return clone as T;
}

/** Read the value at a dotted path (undefined if absent). */
export function getPath(root: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => (acc == null ? undefined : (acc as Record<string, unknown>)[key]), root);
}
