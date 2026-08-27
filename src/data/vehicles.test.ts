// Vehicle photos on the EV vs Gas Calculator.
//
// The calculator shows a photo directly above each model's name and price, so a
// wrong photo reads as a factual claim about that car.
//
// It made one for a long time. Any vehicle missing its own picture fell back to
// a generic EV image, and that image was a photograph of a blue Ford Mustang
// Mach-E. Thirteen cars were affected at once -- the Mercedes-Benz CLA EV, the
// Cybertruck, both Hummers, the electric G-Class -- and every one of them was
// presented to visitors as a Mach-E. It surfaced as "another wrong image" more
// than once, because it was the same bug wearing a different card each time.
//
// The fallback is now a photo of charge posts with no car in it, so the failure
// mode is merely dull rather than false. This file stops the gap reappearing.

import { describe, it, expect } from "vitest";
import { vehicles } from "@/data/vehicles";

describe("every vehicle has its own photograph", () => {
  it("no vehicle falls back to a generic image", () => {
    // A model-specific photo is a remote Wikimedia Commons URL; the fallbacks are
    // bundled local assets. So "resolved to a local asset" means "we had no photo
    // for this car" -- which is exactly the state that produced the Mach-E bug.
    const onFallback = vehicles
      .filter((v) => !String(v.image ?? "").startsWith("https://upload.wikimedia.org/"))
      .map((v) => `${v.id} (${v.name})`);

    expect(onFallback).toEqual([]);
  });

  it("covers the whole catalog, not just the EVs", () => {
    expect(vehicles.length).toBeGreaterThan(190);
    expect(vehicles.every((v) => typeof v.image === "string" && v.image.length > 0)).toBe(true);
  });

  it("only lets TRIMS OF THE SAME MODEL share a photo", () => {
    // Two cars sharing one picture is the same failure as the fallback, just
    // narrower: whichever car is not in the photo is being misrepresented.
    //
    // Except when it is not a failure at all. Seven photos are shared today and
    // every one is a base model and its own variant -- Camry and Camry Hybrid,
    // Mach-E and Mach-E GT, F-150 and F-150 Hybrid. A Camry Hybrid genuinely
    // looks like a Camry, so one photo is correct for both.
    //
    // The rule that separates the two cases: ids in a sharing group must all
    // extend the shortest id in that group, which is what "trim of the same
    // model" looks like in this catalog (toyota-camry / toyota-camry-hybrid).
    // Two unrelated cars on one photo do not satisfy that, and still fail.
    const byUrl = new Map<string, string[]>();
    for (const v of vehicles) {
      const url = String(v.image ?? "");
      byUrl.set(url, [...(byUrl.get(url) ?? []), v.id]);
    }

    const wrong: string[][] = [];
    for (const ids of byUrl.values()) {
      if (ids.length < 2) continue;
      const base = [...ids].sort((a, b) => a.length - b.length)[0];
      if (!ids.every((id) => id === base || id.startsWith(`${base}-`))) wrong.push(ids);
    }

    expect(wrong).toEqual([]);
  });
});
