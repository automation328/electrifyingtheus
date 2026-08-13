// The arithmetic behind "will this upload actually get through?".
//
// Measured against production by POSTing bodies of known size to /api/admin
// with no auth, so the only thing under test was the transport:
//
//   1,097 bytes      -> 401 {"error":"unauthorized"}   (function ran)
//   3,145,728 bytes  -> 401                            (function ran)
//   4,194,304 bytes  -> 401                            (function ran)
//   4,613,734 bytes  -> 413 FUNCTION_PAYLOAD_TOO_LARGE (rejected before it)
//   4,718,592 bytes  -> 413
//   5,242,977 bytes  -> 413
//
// The 413 body is PLAIN TEXT, which is why the CMS showed the bare fallback
// "Upload failed (413)" instead of a useful message: the client does
// r.json().catch(() => ({})) and had nothing to read.

import { describe, it, expect } from "vitest";
import {
  MAX_REQUEST_BYTES, base64Length, maxBinaryBytes, describeTooLarge,
} from "@/lib/upload-limits";

/** The largest body measured to reach the function, and the smallest rejected. */
const MEASURED_PASSED = 4_194_304;
const MEASURED_REJECTED = 4_613_734;

describe("the request budget", () => {
  it("never exceeds the largest body measured to get through", () => {
    expect(MAX_REQUEST_BYTES).toBeLessThanOrEqual(MEASURED_PASSED);
  });

  it("sits below the smallest body measured to be rejected", () => {
    expect(MAX_REQUEST_BYTES).toBeLessThan(MEASURED_REJECTED);
  });
});

describe("base64 inflation", () => {
  it("costs 4 characters for every 3 bytes", () => {
    expect(base64Length(3)).toBe(4);
    expect(base64Length(6)).toBe(8);
    expect(base64Length(300)).toBe(400);
  });

  it("rounds a partial group up to a whole one", () => {
    expect(base64Length(1)).toBe(4);
    expect(base64Length(4)).toBe(8);
  });

  it("makes a 4 MB file into more than 5 MB of body", () => {
    expect(base64Length(4 * 1024 * 1024)).toBeGreaterThan(5 * 1024 * 1024);
  });
});

describe("how big a file may actually be", () => {
  const envelope = 200;

  it("leaves room for the JSON around it", () => {
    const max = maxBinaryBytes(envelope);
    expect(base64Length(max) + envelope).toBeLessThanOrEqual(MAX_REQUEST_BYTES);
  });

  it("is as large as it can be — one more byte would not fit", () => {
    const max = maxBinaryBytes(envelope);
    expect(base64Length(max + 1) + envelope).toBeGreaterThan(MAX_REQUEST_BYTES);
  });

  it("lands near 3 MB, well under the raw file sizes that were failing", () => {
    const max = maxBinaryBytes(envelope);
    expect(max).toBeGreaterThan(2.5 * 1024 * 1024);
    expect(max).toBeLessThan(3.5 * 1024 * 1024);
  });

  it("never goes negative, even with an absurd envelope", () => {
    expect(maxBinaryBytes(99_000_000)).toBe(0);
  });
});

describe("the message an editor sees", () => {
  it("says the actual size and the actual limit, in MB", () => {
    const msg = describeTooLarge(8 * 1024 * 1024, 3 * 1024 * 1024);
    expect(msg).toContain("8");
    expect(msg).toContain("3");
    expect(msg).toMatch(/MB/);
  });

  it("never shows a bare status code", () => {
    expect(describeTooLarge(9_000_000, 3_000_000)).not.toMatch(/413/);
  });
});
