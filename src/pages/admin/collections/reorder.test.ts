// Renumbering a collection group when an editor moves a row.
//
// The case that matters is the tie. Every gallery upload arrives on sort 0
// (galleryConfig.mediaImport), so a naive swap would exchange 0 for 0, write
// nothing, and the row would snap back on the next refresh.

import { describe, it, expect } from "vitest";
import { reorderWrites } from "@/pages/admin/collections/types";

const rows = (...sorts: number[]) => sorts.map((sort, i) => ({ id: `r${i}`, sort }));
const applied = (peers: Record<string, unknown>[], writes: ReturnType<typeof reorderWrites>) => {
  const byId = new Map(writes.map((w) => [String(w.row.id), w.value]));
  return [...peers]
    .map((r) => ({ id: String(r.id), sort: byId.get(String(r.id)) ?? Number(r.sort) }))
    .sort((a, b) => a.sort - b.sort)
    .map((r) => r.id);
};

describe("reordering rows in a collection", () => {
  it("moves a row up past its neighbour", () => {
    const peers = rows(0, 1, 2);
    expect(applied(peers, reorderWrites(peers, "sort", 2, 1))).toEqual(["r0", "r2", "r1"]);
  });

  it("moves a row down past its neighbour", () => {
    const peers = rows(0, 1, 2);
    expect(applied(peers, reorderWrites(peers, "sort", 0, 1))).toEqual(["r1", "r0", "r2"]);
  });

  it("still reorders when every row shares the same value", () => {
    // The real gallery state: six uploads, all on sort 0.
    const peers = rows(0, 0, 0, 0, 0, 0);
    const writes = reorderWrites(peers, "sort", 4, 3);
    expect(writes.length).toBeGreaterThan(0);
    expect(applied(peers, writes)).toEqual(["r0", "r1", "r2", "r4", "r3", "r5"]);
  });

  it("renumbers the group so the ties cannot come back", () => {
    const peers = rows(0, 0, 0);
    const writes = reorderWrites(peers, "sort", 0, 1);
    // Every row ends on a distinct index, in the order the move asked for. Note
    // the new first row is NOT written: it was already 0 and still is, which is
    // the point of filtering to rows whose number actually changed.
    expect(applied(peers, writes)).toEqual(["r1", "r0", "r2"]);
    const finalValues = peers.map((r) => {
      const w = writes.find((x) => x.row.id === r.id);
      return w ? w.value : Number(r.sort);
    });
    expect(new Set(finalValues).size).toBe(3);
    expect(writes.map((w) => String(w.row.id))).toEqual(["r0", "r2"]);
  });

  it("writes only the rows whose number actually changed", () => {
    const peers = rows(0, 1, 2, 3, 4);
    // Swapping the middle pair must not rewrite the rows on either side.
    const writes = reorderWrites(peers, "sort", 1, 2);
    expect(writes.map((w) => String(w.row.id)).sort()).toEqual(["r1", "r2"]);
  });

  it("treats a missing value as 0 rather than NaN", () => {
    const peers = [{ id: "a" }, { id: "b", sort: 1 }];
    expect(reorderWrites(peers, "sort", 0, 1).every((w) => Number.isFinite(w.value))).toBe(true);
  });

  it("returns nothing for a move off either end", () => {
    const peers = rows(0, 1, 2);
    expect(reorderWrites(peers, "sort", 0, -1)).toEqual([]);
    expect(reorderWrites(peers, "sort", 2, 3)).toEqual([]);
    expect(reorderWrites(peers, "sort", 1, 1)).toEqual([]);
  });
});
