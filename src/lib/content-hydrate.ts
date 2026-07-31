// Boot-time hydration of the CMS-editable static datasets (vehicles + incentives).
//
// Unlike blog/events/gallery/jobs — which are read reactively via React Query
// hooks — the vehicle catalog and incentive tables are consumed synchronously all
// over the calculator and rebates pages (some at module scope). Rather than
// refactor every consumer, we merge the DB overrides INTO the static arrays/objects
// in place ONCE, before the app module is imported and rendered. Consumers then
// transparently read the merged data with no changes.
//
// This runs only when Supabase is configured, is time-boxed, and never throws —
// so a slow or failed fetch just falls back to the curated static content.

import { isSupabaseConfigured } from "@/lib/supabase";
import { fetchVehicleOverrides, fetchIncentiveOverrides } from "@/lib/content";
import { applyVehicleOverrides } from "@/data/vehicles";
import { applyIncentiveOverrides } from "@/data/incentives";

const TIMEOUT_MS = 3000;

function withTimeout<T>(p: Promise<T>, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    let done = false;
    const timer = setTimeout(() => { if (!done) { done = true; resolve(fallback); } }, TIMEOUT_MS);
    p.then((v) => { if (!done) { done = true; clearTimeout(timer); resolve(v); } })
     .catch(() => { if (!done) { done = true; clearTimeout(timer); resolve(fallback); } });
  });
}

export async function hydrateStaticContent(): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const [vehicles, incentives] = await Promise.all([
      withTimeout(fetchVehicleOverrides(), { published: [], hiddenIds: [] }),
      withTimeout(fetchIncentiveOverrides(), []),
    ]);
    if (vehicles.published.length || vehicles.hiddenIds.length) {
      applyVehicleOverrides(vehicles.published, vehicles.hiddenIds);
    }
    if (incentives.length) {
      applyIncentiveOverrides(incentives);
    }
  } catch {
    // Ignore — the site renders with the curated static content.
  }
}
