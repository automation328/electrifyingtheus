import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";

// CMS rows store some built-in images by their BUILT address, hash included
// (an editor picked a bundled image, and the row kept "/assets/<name>-<hash>.jpg").
// Vite's hash follows the file's bytes, so re-encoding one of these images gives
// it a new address and the stored one 404s. These copies of the original bytes,
// in public/assets, keep the stored addresses working. Found with:
//   site_pages /electric-public-transit → electric-transit-bus, school-bus
//   site_events "EVADC Picnic"          → evadc-picnic-2026
// Delete a copy only once no row points at it.
const KEPT = [
  "public/assets/electric-transit-bus-C5uoikTK.jpg",
  "public/assets/school-bus-B3jE3V2z.jpg",
  "public/assets/evadc-picnic-2026-By0zgZmb.jpg",
];

describe("image addresses stored in the CMS", () => {
  it.each(KEPT)("%s is still served", (path) => {
    expect(existsSync(path)).toBe(true);
  });
});
