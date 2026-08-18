// The freshness rules behind migration 0014.
//
// The cases that matter here are the ones where a naive implementation quietly
// gets it wrong: an empty valid_to meaning "open-ended" rather than "expired",
// an inclusive last day, and dates never being handed to `new Date()` — which
// would read "2026-11-04" as UTC midnight and end the program a day early for
// every reader in the Americas.

import { describe, it, expect } from "vitest";
import {
  incentiveWindow, reviewFlag, formatIsoDate, isoDaysAgo, todayIso, STALE_AFTER_DAYS,
} from "@/lib/incentive-window";

const TODAY = "2026-08-18";

describe("incentiveWindow", () => {
  it("is open when neither date is set — the common case", () => {
    expect(incentiveWindow({}, TODAY)).toEqual({ state: "open" });
  });

  it("treats a blank valid_to as open-ended, NOT expired", () => {
    expect(incentiveWindow({ validFrom: "2020-01-01" }, TODAY)).toEqual({ state: "open" });
  });

  it("reports a program whose window has closed", () => {
    expect(incentiveWindow({ validTo: "2026-08-17" }, TODAY)).toEqual({ state: "ended", date: "2026-08-17" });
  });

  it("counts the last day as still open (valid_to is inclusive)", () => {
    expect(incentiveWindow({ validTo: TODAY }, TODAY)).toEqual({ state: "open" });
  });

  it("reports a program that has not opened yet", () => {
    expect(incentiveWindow({ validFrom: "2026-08-25" }, TODAY)).toEqual({ state: "upcoming", date: "2026-08-25" });
  });

  it("counts the first day as open", () => {
    expect(incentiveWindow({ validFrom: TODAY }, TODAY)).toEqual({ state: "open" });
  });

  it("handles a full window on both sides", () => {
    const w = { validFrom: "2026-08-25", validTo: "2026-11-04" };
    expect(incentiveWindow(w, "2026-08-18")).toEqual({ state: "upcoming", date: "2026-08-25" });
    expect(incentiveWindow(w, "2026-09-15")).toEqual({ state: "open" });
    expect(incentiveWindow(w, "2026-11-05")).toEqual({ state: "ended", date: "2026-11-04" });
  });

  it("ignores malformed dates rather than hiding the program", () => {
    expect(incentiveWindow({ validTo: "last Tuesday" }, TODAY)).toEqual({ state: "open" });
    expect(incentiveWindow({ validTo: "" }, TODAY)).toEqual({ state: "open" });
  });

  it("crosses a year boundary correctly", () => {
    expect(incentiveWindow({ validTo: "2025-12-31" }, "2026-01-01")).toEqual({ state: "ended", date: "2025-12-31" });
  });
});

describe("reviewFlag", () => {
  it("flags an ended program loudest — it is still on the public page", () => {
    expect(reviewFlag({ valid_to: "2026-08-01", verified_at: TODAY }, TODAY))
      .toEqual({ label: "Ended", tone: "red" });
  });

  it("flags a row nobody has ever verified", () => {
    expect(reviewFlag({}, TODAY)).toEqual({ label: "Never verified", tone: "red" });
    expect(reviewFlag({ verified_at: null }, TODAY)).toEqual({ label: "Never verified", tone: "red" });
  });

  it("flags a row last checked longer ago than the stale window", () => {
    const stale = isoDaysAgo(TODAY, STALE_AFTER_DAYS + 1);
    expect(reviewFlag({ verified_at: stale }, TODAY)).toEqual({ label: "Needs review", tone: "amber" });
  });

  it("says nothing about a recently verified, open program", () => {
    expect(reviewFlag({ verified_at: isoDaysAgo(TODAY, 1) }, TODAY)).toBeNull();
    expect(reviewFlag({ verified_at: TODAY }, TODAY)).toBeNull();
  });

  it("does not flag a row checked exactly on the boundary", () => {
    expect(reviewFlag({ verified_at: isoDaysAgo(TODAY, STALE_AFTER_DAYS) }, TODAY)).toBeNull();
  });
});

describe("isoDaysAgo", () => {
  it("walks back across a month boundary", () => {
    expect(isoDaysAgo("2026-03-01", 1)).toBe("2026-02-28");
  });

  it("handles a leap day", () => {
    expect(isoDaysAgo("2028-03-01", 1)).toBe("2028-02-29");
  });

  it("walks back across a year boundary", () => {
    expect(isoDaysAgo("2026-01-01", 1)).toBe("2025-12-31");
  });
});

describe("formatIsoDate", () => {
  it("formats without dropping a day to a timezone", () => {
    expect(formatIsoDate("2026-11-04")).toBe("4 Nov 2026");
    expect(formatIsoDate("2026-01-01")).toBe("1 Jan 2026");
    expect(formatIsoDate("2026-12-31")).toBe("31 Dec 2026");
  });

  it("passes anything unparseable straight through", () => {
    expect(formatIsoDate("soon")).toBe("soon");
  });
});

describe("todayIso", () => {
  it("uses the LOCAL calendar date, not UTC", () => {
    // 1 Jan 2026 00:30 local. Anywhere with a positive UTC offset this instant
    // is still 31 Dec in UTC — the local date is the one we want.
    expect(todayIso(new Date(2026, 0, 1, 0, 30))).toBe("2026-01-01");
  });

  it("pads single-digit months and days", () => {
    expect(todayIso(new Date(2026, 8, 5, 12, 0))).toBe("2026-09-05");
  });
});
