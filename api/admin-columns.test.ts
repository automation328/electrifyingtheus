import { describe, expect, it } from "vitest";
import { sanitizeRow } from "./admin";

describe("CMS column filter", () => {
  it("drops DB-owned columns on update for everyone", () => {
    const { row, rejected } = sanitizeRow({ id: "x", created_at: "t", updated_at: "1999-01-01", title: "A" }, "admin", "update");
    expect(row.title).toBe("A");
    expect("id" in row || "created_at" in row).toBe(false);
    // updated_at is kept but stamped server-side, never the client's value.
    expect(row.updated_at).not.toBe("1999-01-01");
    expect(rejected).toEqual([]);
  });

  it("keeps id on insert (imports and adoptions may supply it)", () => {
    expect(sanitizeRow({ id: "x", title: "A" }, "editor", "insert").row).toEqual({ id: "x", title: "A" });
  });

  it("stops an author setting placement columns but keeps the rest of the draft", () => {
    const { row, rejected } = sanitizeRow({ title: "A", hidden: true, featured: true, hero_hidden: false, sort: 1 }, "author", "update");
    expect(row).toEqual({ title: "A" });
    expect(rejected.sort()).toEqual(["featured", "hero_hidden", "hidden", "sort"]);
  });

  it("lets editors set placement columns", () => {
    expect(sanitizeRow({ featured: true, hidden: false }, "editor", "update").row).toEqual({ featured: true, hidden: false });
  });

  it("rejects keys that are not column names", () => {
    const { rejected } = sanitizeRow({ "title,status": "x", "Title": "y", "a-b": 1, ok_col: 2 }, "admin", "insert");
    expect(rejected.sort()).toEqual(["Title", "a-b", "title,status"]);
  });
});
