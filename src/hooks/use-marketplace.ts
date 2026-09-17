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

/**
 * The query string /api/marketplace expects.
 *
 * `sort` is our own SortKey, NOT the provider's dialect: the endpoint validates
 * the key it knows and translates it itself. Handing it a pre-translated value
 * fails that guard and silently drops the sort, which is why this is one
 * exported, tested function rather than a string built at the call site.
 */
export function buildMarketplaceQuery(
  query: string, radius: number | null, filters: MarketplaceFilters,
  sort: string | undefined, page: number,
): URLSearchParams {
  const params = new URLSearchParams({ q: query });
  if (radius != null) params.set("radius", String(radius));
  for (const [k, v] of Object.entries(filters)) {
    if (v != null && Number.isFinite(v)) params.set(k, String(v));
  }
  // Only an order the provider itself can apply travels with the request; the
  // rest are applied to the page that comes back, so sending them would only
  // spend a search to receive the same listings again.
  if (sort) params.set("sort", sort);
  if (page > 1) params.set("page", String(page));
  return params;
}

async function fetchListings(
  query: string, radius: number | null, filters: MarketplaceFilters,
  sort: string | undefined, page: number,
): Promise<MarketplaceResponse> {
  const params = buildMarketplaceQuery(query, radius, filters, sort, page);

  const res = await fetch(`/api/marketplace?${params}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || `Search failed (${res.status})`);
  }
  return res.json();
}

export function useMarketplace(
  query: string, radius: number | null = null, filters: MarketplaceFilters = {},
  sort?: string, page = 1,
) {
  return useQuery({
    queryKey: ["marketplace", query, radius, filters, sort ?? null, page],
    queryFn: () => fetchListings(query, radius, filters, sort, page),
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
