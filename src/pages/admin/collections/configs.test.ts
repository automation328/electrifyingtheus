import { describe, it, expect } from "vitest";
import { eventRowIsPast } from "./configs";

describe("eventRowIsPast", () => {
  const today = "2026-10-06";

  it("calls a single-day event past once its date has gone", () => {
    expect(eventRowIsPast({ event_date: "2026-10-05" }, today)).toBe(true);
    expect(eventRowIsPast({ event_date: "2026-10-06" }, today)).toBe(false);
    expect(eventRowIsPast({ event_date: "2026-10-07" }, today)).toBe(false);
  });

  it("keeps a multi-day event until its last day is over", () => {
    expect(eventRowIsPast({ event_date: "2026-09-11", end_date: "2026-10-12" }, today)).toBe(false);
    expect(eventRowIsPast({ event_date: "2026-09-11", end_date: "2026-10-05" }, today)).toBe(true);
  });

  it("ignores an end date earlier than the start, as the site does", () => {
    expect(eventRowIsPast({ event_date: "2026-10-08", end_date: "2026-10-01" }, today)).toBe(false);
  });

  it("never calls a row with no usable date past", () => {
    expect(eventRowIsPast({}, today)).toBe(false);
    expect(eventRowIsPast({ event_date: "soon" }, today)).toBe(false);
  });
});
