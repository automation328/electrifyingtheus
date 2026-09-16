// The one vehicle-listing shape shared by the serverless search endpoint and the
// pages that render it. Provider payloads are normalised into this before they
// cross the wire, so swapping Auto.dev for MarketCheck changes one file and
// nothing above it.

/** Powertrains this marketplace will surface. Anything else is dropped. */
export type ListingPowertrain = "ev" | "phev";

export interface VehicleListing {
  /** Stable id for routing. VIN when the provider gives one, else provider id. */
  id: string;
  vin?: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  /** Asking price in whole dollars. Absent when the dealer hides it. */
  price?: number;
  mileage?: number;
  condition: "new" | "used";
  powertrain: ListingPowertrain;
  /** Catalog vehicle id this listing was matched to, e.g. "tesla-model-3".
   *  Present on every listing we return — an unmatched listing is not returned. */
  catalogId: string;
  /** EPA range in miles, from our catalog rather than the listing. */
  rangeMi?: number;
  dealerName?: string;
  city?: string;
  state?: string;
  /** Straight-line miles from the searched location, computed by us. */
  distanceMi?: number;
  photoUrl?: string;
  /** The dealer's own listing page. */
  listingUrl?: string;
}

export interface MarketplaceResponse {
  listings: VehicleListing[];
  /** Where the search resolved to, echoed back so the UI can say "near Atlanta, GA". */
  place?: { label: string; lat: number; lon: number; radius: number };
  /** False when no provider key is set. The UI says so rather than showing
   *  "no results", which would imply we looked and found nothing. */
  configured: boolean;
  total?: number;
}
