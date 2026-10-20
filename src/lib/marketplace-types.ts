// The one vehicle-listing shape shared by the serverless search endpoint and the
// pages that render it. Provider payloads are normalised into this before they
// cross the wire, so swapping Auto.dev for MarketCheck changes one file and
// nothing above it.

/** Powertrains this marketplace will surface. Anything else is dropped. */
export type ListingPowertrain = "ev" | "phev";

/**
 * Deepest page either side will ask for. The provider switches to cursors past
 * this, which this adapter does not implement, so the server clamps to it and
 * the page stops offering Next there — otherwise every further click spends a
 * metered upstream call to re-receive page 50.
 */
export const MAX_MARKETPLACE_PAGE = 50;

/**
 * A radius that means the whole country. The provider is then asked with no
 * ZIP and no distance at all, which is how it searches everything it holds.
 * A number rather than a flag so it travels in ?radius= like any other ring,
 * and sized past any two points in the US so a clamp can never undercut it.
 */
export const NATIONWIDE_RADIUS = 5000;

/**
 * The rings "Any distance" widens through, nearest first, until one of them
 * holds a car. The provider cannot sort by distance, so asking the whole
 * country at once returns an arbitrary twenty from anywhere; a Cadillac LYRIQ
 * searched from Haslet, TX found nothing in its 15 miles while 297 sat within
 * 500 and Austin was 177 miles away. Widening a ring at a time is what puts
 * the nearest ones first.
 */
export const WIDEN_RADII = [25, 50, 100, 250, 500, NATIONWIDE_RADIUS] as const;

export interface VehicleListing {
  /** Stable id for routing. VIN when the provider gives one, else provider id. */
  id: string;
  vin?: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  /** "AWD", "RWD", "FWD" as the dealer wrote it. Used to pick the EPA rating
   *  for this exact car, and worth showing on the card. */
  drivetrain?: string;
  /** Asking price in whole dollars. Absent when the dealer hides it. */
  price?: number;
  mileage?: number;
  condition: "new" | "used";
  powertrain: ListingPowertrain;
  /** Catalog vehicle id this listing was matched to, e.g. "tesla-model-3".
   *  Present on every listing we return — an unmatched listing is not returned. */
  catalogId: string;
  /**
   * EPA range in miles for THIS car's model year, not for the nameplate.
   * Absent when we hold no figure for a year close to the listing's.
   */
  rangeMi?: number;
  /** Set when that model year sold more than one battery or trim, and the two
   *  ends differ — a 2019 LEAF was sold as both a 150-mile and a 226-mile car. */
  rangeMaxMi?: number;
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
  /**
   * The ring the search started at, set only when "Any distance" found nothing
   * there and widened. `place.radius` is then the ring that was searched, and
   * paging or opening a car has to ask for that ring, not start over.
   */
  widenedFrom?: number;
  /** False when no provider key is set. The UI says so rather than showing
   *  "no results", which would imply we looked and found nothing. */
  configured: boolean;
  /**
   * Listings the provider matched in the radius, ignoring paging — an upper
   * bound on what is out there, NOT a count of electrified cars. Our own fuel
   * and catalog checks run after it, so the verified count is listings.length.
   * Undefined when the provider reported no count.
   */
  total?: number;
  /** 1-based page of provider results this response came from. */
  page: number;
  /** Listings the provider put on this page, before our electrified check. */
  pageSize?: number;
  /**
   * How many pages the provider's own results run to. Computed server-side
   * from a page size we know is real, because the plan silently clamps what we
   * ask for; undefined when the provider reported no count. Counts pages of
   * MATCHED listings, not of verified electrified ones.
   */
  pageCount?: number;
  /** The provider has at least one more page after this one, and we can reach it. */
  hasMore: boolean;
}
