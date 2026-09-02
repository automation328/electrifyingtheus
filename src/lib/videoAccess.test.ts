// Video access is remembered per browser, and deliberately does NOT follow from
// the lighter name+email gates. These two facts are the whole contract.

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { hasVideoAccess, saveVideoAccess } from "@/lib/videoAccess";
import { saveLeadIdentity } from "@/lib/leadIdentity";

beforeEach(() => localStorage.clear());
afterEach(() => { localStorage.clear(); vi.restoreAllMocks(); });

describe("video access memory", () => {
  it("starts closed for a new browser", () => {
    expect(hasVideoAccess()).toBe(false);
  });

  it("stays open once the gate is completed", () => {
    saveVideoAccess();
    expect(hasVideoAccess()).toBe(true);
  });

  it("is not granted by the name+email identity other gates capture", () => {
    // Someone who shared a photo or unlocked the calculator has given us two
    // fields. The video gate wants ten, so it must still ask.
    saveLeadIdentity({ firstName: "Alex", email: "alex@example.com" });
    expect(hasVideoAccess()).toBe(false);
  });

  it("reports no access rather than throwing when storage is blocked", () => {
    // Private mode: reads throw. Failing closed asks again, which is the safe
    // direction — failing open would hand the video over for free.
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    expect(hasVideoAccess()).toBe(false);
  });

  it("does not throw when a blocked browser writes", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    expect(() => saveVideoAccess()).not.toThrow();
  });
});
