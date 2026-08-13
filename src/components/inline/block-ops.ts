// The block-list edits behind the on-page builder, as pure functions.
//
// These used to be private to EditableContentPage. Blog posts now get the same
// builder, and duplicating "move a block up" in two places is how the two
// copies quietly stop agreeing — so they live here and both editors call them.

import { PAGE_OVERRIDE_KEYS, type PageOverride, type PageBlock } from "@/lib/page-content";
import { regenIds } from "@/components/inline/blocks/factory";

/** Track intentionally-cleared top-level fields so an editor's blank wins over
 *  the static default (see mergePageOverride's `cleared` tombstone). */
export const trackCleared = (next: PageOverride, path: string, v: unknown): PageOverride => {
  if (typeof path !== "string" || path.includes(".") || path === "cleared" || !(PAGE_OVERRIDE_KEYS as string[]).includes(path)) return next;
  const emptied = v === null || v === undefined || (typeof v === "string" && v.trim() === "") || (Array.isArray(v) && v.length === 0);
  const set = new Set(next.cleared ?? []);
  if (emptied) set.add(path); else set.delete(path);
  return { ...next, cleared: set.size ? Array.from(set) : undefined };
};

const lastIndexWhere = <T,>(arr: T[], pred: (x: T) => boolean): number => {
  for (let i = arr.length - 1; i >= 0; i--) if (pred(arr[i])) return i;
  return -1;
};

/**
 * Move a block one step "up"/"down" in overall page order: reorder within its
 * slot when it has a neighbour there, otherwise hop to the adjacent slot (using
 * the page's ordered slot list) so up/down always does something visible.
 */
export function moveBlockInList(blocks: PageBlock[], id: string, dir: -1 | 1, slotOrder: string[]): PageBlock[] {
  const arr = [...blocks];
  const idx = arr.findIndex((b) => b.id === id);
  if (idx < 0) return arr;
  const b = arr[idx];
  const siblings = arr.filter((x) => x.slot === b.slot);
  const pos = siblings.indexOf(b);

  // Same-slot neighbour → swap.
  if (dir === -1 && pos > 0) {
    const j = arr.indexOf(siblings[pos - 1]);
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    return arr;
  }
  if (dir === 1 && pos < siblings.length - 1) {
    const j = arr.indexOf(siblings[pos + 1]);
    [arr[idx], arr[j]] = [arr[j], arr[idx]];
    return arr;
  }

  // At the slot edge → hop to the adjacent slot.
  const si = slotOrder.indexOf(b.slot);
  const target = slotOrder[si + dir];
  if (!target) return arr; // already at the page edge
  const without = arr.filter((x) => x.id !== id);
  const moved: PageBlock = { ...b, slot: target };
  if (dir === -1) {
    const at = lastIndexWhere(without, (x) => x.slot === target);
    if (at < 0) without.push(moved); else without.splice(at + 1, 0, moved);
  } else {
    const at = without.findIndex((x) => x.slot === target);
    if (at < 0) without.push(moved); else without.splice(at, 0, moved);
  }
  return without;
}

// The three below descend into container children too, so edits from the Layers
// panel / Inspector act on nested blocks and not just top-level ones.

export function patchBlockDeep(blocks: PageBlock[], id: string, patch: Partial<PageBlock>): PageBlock[] {
  return blocks.map((b) =>
    b.id === id ? { ...b, ...patch }
      : b.children?.length ? { ...b, children: patchBlockDeep(b.children, id, patch) }
        : b);
}

export function removeBlockDeep(blocks: PageBlock[], id: string): PageBlock[] {
  return blocks
    .filter((b) => b.id !== id)
    .map((b) => (b.children?.length ? { ...b, children: removeBlockDeep(b.children, id) } : b));
}

export function duplicateBlockDeep(blocks: PageBlock[], id: string): PageBlock[] {
  const i = blocks.findIndex((b) => b.id === id);
  if (i >= 0) return [...blocks.slice(0, i + 1), regenIds(blocks[i]), ...blocks.slice(i + 1)];
  return blocks.map((b) => (b.children?.length ? { ...b, children: duplicateBlockDeep(b.children, id) } : b));
}

/** Move a dragged block to sit before/after a target block. */
export function moveBlockRelativeInList(blocks: PageBlock[], dragId: string, targetId: string, before: boolean): PageBlock[] {
  if (dragId === targetId) return blocks;
  const dragged = blocks.find((b) => b.id === dragId);
  const target = blocks.find((b) => b.id === targetId);
  if (!dragged || !target) return blocks;
  const without = blocks.filter((b) => b.id !== dragId);
  const ti = without.findIndex((b) => b.id === targetId);
  const moved: PageBlock = { ...dragged, slot: target.slot };
  const at = before ? ti : ti + 1;
  return [...without.slice(0, at), moved, ...without.slice(at)];
}
