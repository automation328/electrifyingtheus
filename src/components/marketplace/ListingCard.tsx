import { Link } from "react-router-dom";
import { MapPin, BatteryCharging } from "lucide-react";
import type { VehicleListing } from "@/lib/marketplace-types";

const usd = (n?: number) =>
  n == null
    ? "Call for price"
    : new Intl.NumberFormat("en-US", {
        style: "currency", currency: "USD", maximumFractionDigits: 0,
      }).format(n);

const away = (n?: number) =>
  n == null ? null : `${n < 10 ? n.toFixed(1) : Math.round(n)} mi away`;

/** One vehicle in the results grid.
 *
 *  Every badge on this card is something we can prove from the listing or our
 *  own catalog. Rival sites decorate cards with "Great deal" and "Price drop",
 *  which need a price history and a market model we do not have; inventing them
 *  would be inventing the one thing a shopper is here to trust. */
export function ListingCard({
  listing, search,
}: { listing: VehicleListing; search: string }) {
  const title = `${listing.year} ${listing.make} ${listing.model}`;
  const place = [listing.city, listing.state].filter(Boolean).join(", ");
  const distance = away(listing.distanceMi);

  return (
    <article className="h-full">
      <Link
        to={`/marketplace/${encodeURIComponent(listing.id)}${search}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {listing.photoUrl ? (
            <img
              src={listing.photoUrl}
              alt={`${title} for sale${place ? ` in ${place}` : ""}`}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="grid h-full w-full place-items-center text-muted-foreground">
              <BatteryCharging className="h-10 w-10 opacity-40" />
            </div>
          )}

          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {listing.condition === "new" && (
              <span className="rounded-md bg-primary px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground shadow-sm">
                New
              </span>
            )}
            <span className="rounded-md bg-background/95 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground shadow-sm backdrop-blur-sm">
              {listing.powertrain === "phev" ? "Plug-in hybrid" : "Electric"}
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-1 p-4">
          <h3 className="font-charge text-lg leading-tight text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">
            {[listing.trim, listing.mileage != null
              ? `${listing.mileage.toLocaleString("en-US")} mi`
              : null].filter(Boolean).join(" · ") || "Trim not listed"}
          </p>

          <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>
              {place || "Location on request"}
              {distance && (
                <span className="block text-xs tabular-nums opacity-80">{distance}</span>
              )}
            </span>
          </p>

          <div className="mt-auto flex items-end justify-between gap-3 pt-3">
            {/* Range, not mileage: the odometer is already on the line under
                the title, and range is the number this site exists to put in
                front of someone deciding between two electric cars. */}
            {/* Set at the price's size on purpose. These are the two numbers the
                choice is made on, and range in a small grey pill next to a large
                black price reads as a footnote to it. */}
            {listing.rangeMi != null && (
              <p className="inline-flex items-baseline gap-1.5 font-charge text-xl leading-none text-secondary">
                <BatteryCharging className="h-4 w-4 shrink-0 self-center" aria-hidden />
                <span className="tabular-nums">
                  {listing.rangeMaxMi && listing.rangeMaxMi !== listing.rangeMi
                    ? `${listing.rangeMi}–${listing.rangeMaxMi}`
                    : listing.rangeMi}
                </span>
                <span className="text-sm text-muted-foreground">mi range</span>
              </p>
            )}
            <p className="font-charge text-xl leading-none text-foreground whitespace-nowrap">{usd(listing.price)}</p>
          </div>
        </div>
      </Link>
    </article>
  );
}

/** Matches the card's shape so the grid does not reflow when results land. */
export function ListingCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="aspect-[16/10] animate-pulse bg-muted" />
      <div className="space-y-2.5 p-4">
        <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        <div className="flex items-center justify-between pt-3">
          <div className="h-6 w-24 animate-pulse rounded bg-muted" />
          <div className="h-6 w-20 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
