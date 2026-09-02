// Resolving job title / department / industry to GoHighLevel custom fields.
//
// The risk this guards is silent: a wrong or missing id means the value simply
// never appears in the CRM, and nothing errors. So the tests pin both halves —
// which field an id is matched from, and the refusal to send anything at all
// when there is no id or no value.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  pickCustomFieldIds, buildCustomFields, customFieldIds, resetCustomFieldCache,
} from "./_ghl-fields";

const FIELDS = [
  { id: "f-title", name: "Job Title", fieldKey: "contact.job_title" },
  { id: "f-dept", name: "Department", fieldKey: "contact.department" },
  { id: "f-industry", name: "Industry", fieldKey: "contact.industry" },
  { id: "f-other", name: "Favourite EV", fieldKey: "contact.favourite_ev" },
];

const okRes = (body: unknown) =>
  ({ ok: true, status: 200, json: async () => body }) as unknown as Response;

beforeEach(() => {
  resetCustomFieldCache();
  delete process.env.GHL_CF_TITLE;
  delete process.env.GHL_CF_DEPARTMENT;
  delete process.env.GHL_CF_INDUSTRY;
});
afterEach(() => { resetCustomFieldCache(); vi.restoreAllMocks(); });

describe("matching a location's custom fields", () => {
  it("finds all three by field key", () => {
    expect(pickCustomFieldIds(FIELDS)).toEqual({
      title: "f-title", department: "f-dept", industry: "f-industry",
    });
  });

  it("falls back to the field's name when the key is something else", () => {
    const odd = [{ id: "x1", name: "Industry", fieldKey: "contact.cf_9f2b" }];
    expect(pickCustomFieldIds(odd)).toEqual({ industry: "x1" });
  });

  it("matches names case-insensitively", () => {
    expect(pickCustomFieldIds([{ id: "x2", name: "  DEPARTMENT " }])).toEqual({ department: "x2" });
  });

  it("resolves nothing when the location has no such fields", () => {
    expect(pickCustomFieldIds([{ id: "z", name: "Favourite EV", fieldKey: "contact.fav" }])).toEqual({});
  });

  it("lets an explicit id win over anything found in the listing", () => {
    const ids = pickCustomFieldIds(FIELDS, { title: "env-title" });
    expect(ids.title).toBe("env-title");
    expect(ids.department).toBe("f-dept");
  });
});

describe("building the upsert payload", () => {
  it("sends only fields that have both an id and a value", () => {
    const ids = { title: "f-title", department: "f-dept" };
    expect(buildCustomFields(ids, { title: "Fleet Manager", department: "", industry: "Utility" }))
      .toEqual([{ id: "f-title", value: "Fleet Manager" }]);
  });

  it("never sends a blank, so a CRM value is not overwritten with nothing", () => {
    expect(buildCustomFields({ title: "f-title" }, { title: "   " })).toEqual([]);
  });

  it("trims what it does send", () => {
    expect(buildCustomFields({ industry: "f-industry" }, { industry: " Education " }))
      .toEqual([{ id: "f-industry", value: "Education" }]);
  });
});

describe("looking the ids up from the location", () => {
  it("reads the listing once and reuses it", async () => {
    const ghl = vi.fn(async () => okRes({ customFields: FIELDS }));
    const first = await customFieldIds(ghl, "loc-1");
    const second = await customFieldIds(ghl, "loc-1");
    expect(first).toEqual({ title: "f-title", department: "f-dept", industry: "f-industry" });
    expect(second).toEqual(first);
    expect(ghl).toHaveBeenCalledTimes(1);
  });

  it("looks again once the cached listing has aged out", async () => {
    const ghl = vi.fn(async () => okRes({ customFields: FIELDS }));
    await customFieldIds(ghl, "loc-1", 0);
    await customFieldIds(ghl, "loc-1", 11 * 60 * 1000);
    expect(ghl).toHaveBeenCalledTimes(2);
  });

  it("skips the call entirely when every id is pinned by env", async () => {
    process.env.GHL_CF_TITLE = "e1";
    process.env.GHL_CF_DEPARTMENT = "e2";
    process.env.GHL_CF_INDUSTRY = "e3";
    const ghl = vi.fn(async () => okRes({ customFields: FIELDS }));
    expect(await customFieldIds(ghl, "loc-1")).toEqual({ title: "e1", department: "e2", industry: "e3" });
    expect(ghl).not.toHaveBeenCalled();
  });

  it("resolves to nothing — not an error — when the listing fails", async () => {
    const ghl = vi.fn(async () => { throw new Error("network"); });
    await expect(customFieldIds(ghl, "loc-1")).resolves.toEqual({});
  });

  it("does not retry a failed listing on every lead", async () => {
    const ghl = vi.fn(async () => ({ ok: false, status: 401, json: async () => ({}) }) as unknown as Response);
    await customFieldIds(ghl, "loc-1", 0);
    await customFieldIds(ghl, "loc-1", 60 * 1000);
    expect(ghl).toHaveBeenCalledTimes(1);
  });
});
