import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { MarketplaceResponse, VehicleListing } from "@/lib/marketplace-types";

// Search electrified vehicles for sale near a place, via the /api/marketplace
// proxy. Mirrors the charger finder's data flow: the applied query string drives
// the request, previous results stay on screen while the next search runs.

export interface MarketplaceFilters {
  priceMin?: number;
  priceMax?: number;
  yearMin?: number;
  yearMax?: number;
}

async function fetchListings(
  query: string, radius: number | null, filters: MarketplaceFilters,
): Promise<MarketplaceResponse> {
  const params = new URLSearchParams({ q: query });
  if (radius != null) params.set("radius", String(radius));
  for (const [k, v] of Object.entries(filters)) {
    if (v != null && Number.isFinite(v)) params.set(k, String(v));
  }

  const res = await fetch(`/api/marketplace?${params}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || `Search failed (${res.status})`);
  }
  return res.json();
}

export function useMarketplace(
  query: string, radius: number | null = null, filters: MarketplaceFilters = {},
) {
  return useQuery({
    queryKey: ["marketplace", query, radius, filters],
    queryFn: () => fetchListings(query, radius, filters),
    enabled: query.trim().length > 0,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000, // listings move slowly; don't re-spend quota on a remount
    retry: 1,
  });
}

/** Find one listing within an already-fetched search result. Listing detail has
 *  no by-id endpoint upstream, so the detail page reads from the search the
 *  visitor arrived from and falls back to re-searching their location. */
export function findListing(data: MarketplaceResponse | undefined, id: string): VehicleListing | undefined {
  return data?.listings.find((l) => l.id === id);
}
