// The decisions behind shrinking an image before upload.
//
// The drawing itself needs a real canvas, which the test environment has not
// got, so every judgement call lives in these pure helpers and is tested here.

import { describe, it, expect } from "vitest";
import { targetDimensions, shouldCompress, MAX_DIMENSION } from "@/lib/image-compress";

describe("choosing new dimensions", () => {
  it("shrinks the long edge to the cap and keeps the shape", () => {
    expect(targetDimensions(4000, 3000, 2200)).toEqual({ width: 2200, height: 1650 });
  });

  it("works the same for a tall image", () => {
    expect(targetDimensions(3000, 4000, 2200)).toEqual({ width: 1650, height: 2200 });
  });

  it("leaves an already-small image alone", () => {
    expect(targetDimensions(1000, 800, 2200)).toEqual({ width: 1000, height: 800 });
  });

  it("returns whole pixels", () => {
    const { width, height } = targetDimensions(1999, 1333, 1000);
    expect(Number.isInteger(width)).toBe(true);
    expect(Number.isInteger(height)).toBe(true);
  });

  it("never collapses a dimension to zero", () => {
    const { width, height } = targetDimensions(4000, 3, 100);
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
  });

  it("copes with a degenerate image", () => {
    expect(targetDimensions(0, 0, 2200)).toEqual({ width: 0, height: 0 });
  });

  it("caps at a sensible size for a web page", () => {
    expect(MAX_DIMENSION).toBeGreaterThanOrEqual(1600);
    expect(MAX_DIMENSION).toBeLessThanOrEqual(3000);
  });
});

describe("deciding whether to touch the file at all", () => {
  const LIMIT = 3 * 1024 * 1024;

  it("compresses a photo that is over the limit", () => {
    expect(shouldCompress("image/jpeg", 8 * 1024 * 1024, LIMIT)).toBe(true);
    expect(shouldCompress("image/png", 5 * 1024 * 1024, LIMIT)).toBe(true);
  });

  it("leaves a file that already fits completely untouched", () => {
    // Re-encoding a small file would only throw away quality for nothing.
    expect(shouldCompress("image/jpeg", 900 * 1024, LIMIT)).toBe(false);
  });

  it("does not rasterise an SVG", () => {
    expect(shouldCompress("image/svg+xml", 8 * 1024 * 1024, LIMIT)).toBe(false);
  });

  it("does not flatten an animated GIF to one frame", () => {
    expect(shouldCompress("image/gif", 8 * 1024 * 1024, LIMIT)).toBe(false);
  });

  it("ignores a file with no type rather than guessing", () => {
    expect(shouldCompress("", 8 * 1024 * 1024, LIMIT)).toBe(false);
  });
});
