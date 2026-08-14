// Saving an incentive card edited in place on /rebates-incentives.
//
// The rule worth testing is the one that is invisible in the UI: DB incentive
// rows are matched to curated programs BY NAME within their bucket. Rename a
// curated program without suppressing the original and the overlay appends the
// new name beside the old one — the program shows up twice. The proof below runs
// the real applyIncentiveOverrides rather than restating the rule in a comment.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  incentiveKey, parseIncentiveKey, locateIncentive, planIncentiveEdits, saveIncentiveEdits,
  type IncentiveRow, type IncentiveTarget,
} from "@/lib/incentive-edit";
import {
  STATE_INCENTIVES, UTILITY_INCENTIVES, applyIncentiveOverrides, type Incentive,
} from "@/data/incentives";

// applyIncentiveOverrides mutates the curated arrays IN PLACE (that is how the
// boot-time overlay works), so anything that calls it has to put them back or
// every later test inherits the edit.
const CA_VEHICLE = () => STATE_INCENTIVES.CA!.vehicle!;
let snapshot: Incentive[] = [];
beforeEach(() => { snapshot = [...CA_VEHICLE()]; });
afterEach(() => { const b = CA_VEHICLE(); b.splice(0, b.length, ...snapshot); });

const target = (name: string): IncentiveTarget =>
  ({ scope: "state", state: "CA", category: "vehicle", name });

const PROGRAM: Incentive = {
  name: "Example Rebate", jurisdiction: "California Incentive", amount: "$500",
  desc: "Original description.", link: "https://example.org/apply",
};

const row = (over: Partial<IncentiveRow> = {}): IncentiveRow => ({
  id: "row-1", scope: "state", state: "CA", category: "vehicle",
  name: "Example Rebate", jurisdiction: "California Incentive", amount: "$500",
  income: false, used: false, description: "Original description.",
  link: "https://example.org/apply", hidden: false, status: "published", ...over,
});

const findFixed = (p: Incentive | undefined) => () => p;

describe("the key that carries a card's edits through the draft", () => {
  it("never contains a dot, because the draft path is split on dots", () => {
    // "Rebate v1.5" would otherwise nest itself into extra objects the editor
    // never reads back.
    const k = incentiveKey(target("Rebate v1.5 (2026)"));
    expect(k).not.toContain(".");
  });

  it("round-trips a name containing dots, pipes and tildes", () => {
    const t = target("A.B|C~D");
    expect(parseIncentiveKey(incentiveKey(t))).toEqual(t);
  });

  it("round-trips a utility program, which has no category", () => {
    const t: IncentiveTarget = { scope: "utility", state: "CA", category: null, name: "PG&E Empower EV" };
    expect(parseIncentiveKey(incentiveKey(t))).toEqual(t);
  });

  it("round-trips a federal program, which has no state", () => {
    const t: IncentiveTarget = { scope: "federal", state: null, category: "vehicle", name: "Some Credit" };
    expect(parseIncentiveKey(incentiveKey(t))).toEqual(t);
  });

  it("rejects a key with an unknown scope", () => {
    expect(parseIncentiveKey("bogus|CA|vehicle|Name")).toBeNull();
  });

  it("rejects a malformed key", () => {
    expect(parseIncentiveKey("state|CA")).toBeNull();
  });
});

describe("working out which bucket a rendered card came from", () => {
  it("finds a curated state program by reference", () => {
    const item = CA_VEHICLE()[0];
    expect(locateIncentive(item)).toEqual({
      scope: "state", state: "CA", category: "vehicle", name: item.name,
    });
  });

  it("finds a curated utility program", () => {
    const item = UTILITY_INCENTIVES.CA![0];
    expect(locateIncentive(item)).toEqual({
      scope: "utility", state: "CA", category: null, name: item.name,
    });
  });

  it("returns null for a program that belongs to no bucket", () => {
    // A card with no target stays read-only rather than saving into the wrong
    // bucket — a state program written as federal would show in every state.
    expect(locateIncentive({ name: "Nowhere", jurisdiction: "", desc: "", link: "" })).toBeNull();
  });
});

describe("planning the write for an edited card", () => {
  it("inserts a new row for a curated program that has none yet", () => {
    const groups = { [incentiveKey(target("Example Rebate"))]: { description: "New text." } };
    const { writes } = planIncentiveEdits(groups, [], findFixed(PROGRAM));
    expect(writes).toHaveLength(1);
    expect(writes[0].id).toBeUndefined();
    expect(writes[0].row).toMatchObject({
      scope: "state", state: "CA", category: "vehicle",
      name: "Example Rebate", description: "New text.", status: "published", hidden: false,
    });
  });

  it("writes the description column, not the in-memory desc field", () => {
    // The row goes to PostgREST: `desc` is not a column and would be dropped.
    const groups = { [incentiveKey(target("Example Rebate"))]: { description: "New text." } };
    const { writes } = planIncentiveEdits(groups, [], findFixed(PROGRAM));
    expect(Object.keys(writes[0].row)).toContain("description");
    expect(Object.keys(writes[0].row)).not.toContain("desc");
  });

  it("updates the existing row when one already backs the card", () => {
    const groups = { [incentiveKey(target("Example Rebate"))]: { description: "Edited." } };
    const { writes } = planIncentiveEdits(groups, [row({ id: "row-9" })], findFixed(PROGRAM));
    expect(writes).toHaveLength(1);
    expect(writes[0].id).toBe("row-9");
  });

  it("never treats a tombstone as the card's row", () => {
    // Updating a hidden row would un-hide the curated original it suppresses.
    const groups = { [incentiveKey(target("Example Rebate"))]: { description: "Edited." } };
    const { writes } = planIncentiveEdits(groups, [row({ id: "tomb", hidden: true })], findFixed(PROGRAM));
    expect(writes[0].id).toBeUndefined();
  });

  it("carries across the fields that were not edited", () => {
    const groups = { [incentiveKey(target("Example Rebate"))]: { description: "Edited." } };
    const { writes } = planIncentiveEdits(groups, [], findFixed(PROGRAM));
    expect(writes[0].row).toMatchObject({
      jurisdiction: "California Incentive", amount: "$500", link: "https://example.org/apply",
    });
  });

  it("preserves the income and used flags, which are not editable on the card", () => {
    const flagged = { ...PROGRAM, income: true, used: true };
    const groups = { [incentiveKey(target("Example Rebate"))]: { description: "Edited." } };
    const { writes } = planIncentiveEdits(groups, [], findFixed(flagged));
    expect(writes[0].row).toMatchObject({ income: true, used: true });
  });

  it("lets an amount be added to a program that had none", () => {
    const bare = { ...PROGRAM, amount: undefined };
    const groups = { [incentiveKey(target("Example Rebate"))]: { amount: "Up to $2,000" } };
    const { writes } = planIncentiveEdits(groups, [], findFixed(bare));
    expect(writes[0].row.amount).toBe("Up to $2,000");
  });

  it("lets an amount be cleared", () => {
    const groups = { [incentiveKey(target("Example Rebate"))]: { amount: "  " } };
    const { writes } = planIncentiveEdits(groups, [], findFixed(PROGRAM));
    expect(writes[0].row.amount).toBe("");
  });

  it("keeps the original name when the name is emptied", () => {
    // A blank name would orphan the row from its bucket and from the CMS list.
    const groups = { [incentiveKey(target("Example Rebate"))]: { name: "   " } };
    const { writes } = planIncentiveEdits(groups, [], findFixed(PROGRAM));
    expect(writes[0].row.name).toBe("Example Rebate");
    expect(writes).toHaveLength(1); // no tombstone: nothing was renamed
  });

  it("skips a key it cannot parse", () => {
    const { writes } = planIncentiveEdits({ "not-a-key": { name: "x" } }, [], findFixed(PROGRAM));
    expect(writes).toHaveLength(0);
  });

  it("skips a card whose program no longer exists", () => {
    const groups = { [incentiveKey(target("Gone"))]: { description: "x" } };
    const { writes } = planIncentiveEdits(groups, [], findFixed(undefined));
    expect(writes).toHaveLength(0);
  });
});

describe("renaming a program", () => {
  const groups = { [incentiveKey(target("Example Rebate"))]: { name: "Renamed Rebate" } };

  it("also writes a tombstone for the original name", () => {
    const { writes } = planIncentiveEdits(groups, [], findFixed(PROGRAM));
    expect(writes).toHaveLength(2);
    expect(writes[0].row).toMatchObject({ name: "Renamed Rebate", hidden: false });
    expect(writes[1].row).toMatchObject({ name: "Example Rebate", hidden: true, status: "published" });
  });

  it("reuses an existing tombstone rather than piling up duplicates", () => {
    const rows = [row({ id: "tomb-1", hidden: true })];
    const { writes } = planIncentiveEdits(groups, rows, findFixed(PROGRAM));
    expect(writes[1].id).toBe("tomb-1");
  });

  it("leaves exactly ONE card once the overlay is applied", () => {
    // The whole point. Without the tombstone the curated original survives and
    // the renamed program is appended next to it.
    const before = CA_VEHICLE().length;
    const original = CA_VEHICLE()[0];
    const g = { [incentiveKey(target(original.name))]: { name: "Renamed Rebate" } };
    const { overrides } = planIncentiveEdits(g, []);

    applyIncentiveOverrides(overrides);

    const names = CA_VEHICLE().map((i) => i.name);
    expect(names).not.toContain(original.name);
    expect(names.filter((n) => n === "Renamed Rebate")).toHaveLength(1);
    expect(CA_VEHICLE()).toHaveLength(before);
  });

  it("edits without a rename replace the card in place", () => {
    const before = CA_VEHICLE().length;
    const original = CA_VEHICLE()[0];
    const g = { [incentiveKey(target(original.name))]: { description: "Rewritten." } };
    const { overrides } = planIncentiveEdits(g, []);

    applyIncentiveOverrides(overrides);

    expect(CA_VEHICLE()).toHaveLength(before);
    expect(CA_VEHICLE().find((i) => i.name === original.name)?.desc).toBe("Rewritten.");
  });
});

describe("performing the save", () => {
  const io = () => ({
    listRows: vi.fn(async (..._a: unknown[]) => [] as IncentiveRow[]),
    insertRow: vi.fn(async (..._a: unknown[]) => ({})),
    updateRow: vi.fn(async (..._a: unknown[]) => ({})),
    apply: vi.fn((..._a: unknown[]) => {}),
    now: () => "2026-01-01T00:00:00.000Z",
  });

  it("does nothing at all when no card was touched", async () => {
    const d = io();
    expect(await saveIncentiveEdits({}, d)).toBe(0);
    expect(d.listRows).not.toHaveBeenCalled();
    expect(d.insertRow).not.toHaveBeenCalled();
  });

  it("inserts for a curated card and stamps updated_at", async () => {
    const d = io();
    const groups = { [incentiveKey(target(CA_VEHICLE()[0].name))]: { description: "Edited." } };
    expect(await saveIncentiveEdits(groups, d)).toBe(1);
    expect(d.insertRow).toHaveBeenCalledTimes(1);
    const [table, sent] = d.insertRow.mock.calls[0] as [string, Record<string, unknown>];
    expect(table).toBe("site_incentives");
    expect(sent.updated_at).toBe("2026-01-01T00:00:00.000Z");
    expect(sent.description).toBe("Edited.");
  });

  it("updates when a row already exists", async () => {
    const d = io();
    const name = CA_VEHICLE()[0].name;
    d.listRows = vi.fn(async (..._a: unknown[]) => [row({ id: "row-7", name })]);
    const groups = { [incentiveKey(target(name))]: { description: "Edited." } };
    await saveIncentiveEdits(groups, d);
    expect(d.updateRow).toHaveBeenCalledTimes(1);
    expect(d.insertRow).not.toHaveBeenCalled();
    expect((d.updateRow.mock.calls[0] as unknown[])[1]).toBe("row-7");
  });

  it("merges the saved text back in, so the card does not revert on close", async () => {
    const d = io();
    const groups = { [incentiveKey(target(CA_VEHICLE()[0].name))]: { description: "Edited." } };
    await saveIncentiveEdits(groups, d);
    expect(d.apply).toHaveBeenCalledTimes(1);
  });

  it("does not merge anything when every card was skipped", async () => {
    const d = io();
    await saveIncentiveEdits({ "not-a-key": { name: "x" } }, d);
    expect(d.apply).not.toHaveBeenCalled();
  });
});
