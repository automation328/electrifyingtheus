import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, MapPin, Gauge, Loader2, BatteryCharging, Info } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useEmbedFrame } from "@/hooks/useEmbedFrame";
import { useMarketplace } from "@/hooks/use-marketplace";
import {
  sortListings, isSortKey, SORT_OPTIONS, DEFAULT_SORT, type SortKey,
} from "@/lib/marketplace-sort";
import type { VehicleListing } from "@/lib/marketplace-types";

const MAX_QUERY = 120;
const RADII = [25, 50, 100, 250];

const usd = (n?: number) =>
  n == null ? "Call for price"
    : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

const miles = (n?: number) =>
  n == null ? "" : `${n < 10 ? n.toFixed(1) : Math.round(n)} mi away`;

function ListingCard({ listing, search }: { listing: VehicleListing; search: string }) {
  const title = `${listing.year} ${listing.make} ${listing.model}`;
  return (
    <Link
      to={`/marketplace/${encodeURIComponent(listing.id)}${search}`}
      className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-elevated transition-shadow"
    >
      <div className="aspect-[16/10] bg-muted overflow-hidden">
        {listing.photoUrl ? (
          <img
            src={listing.photoUrl}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-muted-foreground">
            <BatteryCharging className="w-10 h-10 opacity-40" />
          </div>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col gap-1.5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          {listing.condition === "new" ? "New" : "Used"}
          {listing.trim ? ` · ${listing.trim}` : ""}
        </div>
        <div className="font-charge text-lg leading-tight text-foreground">{title}</div>
        <div className="font-charge text-xl text-foreground">{usd(listing.price)}</div>
        <div className="mt-auto pt-2 text-sm text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
          {listing.mileage != null && (
            <span className="inline-flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5" />{listing.mileage.toLocaleString()} mi
            </span>
          )}
          {listing.rangeMi != null && (
            <span className="inline-flex items-center gap-1">
              <BatteryCharging className="w-3.5 h-3.5" />{listing.rangeMi} mi range
            </span>
          )}
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" />
          {[listing.city, listing.state].filter(Boolean).join(", ") || "Location on request"}
          {listing.distanceMi != null && <span className="opacity-70"> · {miles(listing.distanceMi)}</span>}
        </div>
      </div>
    </Link>
  );
}

const Marketplace = () => {
  const [params, setParams] = useSearchParams();
  const embed = params.get("embed") === "1";
  useEmbedFrame(embed);

  const urlQuery = (params.get("q") || "").trim().slice(0, MAX_QUERY);
  const [typed, setTyped] = useState(urlQuery);
  const [query, setQuery] = useState(urlQuery);
  const [radius, setRadius] = useState<number | null>(Number(params.get("radius")) || null);

  // The URL is the source of truth for the order, so a shared or embedded link
  // reopens the way it was sent. Anything else in the param falls back.
  const sortParam = params.get("sort");
  const sort: SortKey = isSortKey(sortParam) ? sortParam : DEFAULT_SORT;

  useEffect(() => { setTyped(urlQuery); setQuery(urlQuery); }, [urlQuery]);

  const { data, isFetching, error } = useMarketplace(query, radius);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = typed.trim().slice(0, MAX_QUERY);
    setQuery(next);
    const p = new URLSearchParams(params);
    if (next) p.set("q", next); else p.delete("q");
    if (radius) p.set("radius", String(radius)); else p.delete("radius");
    setParams(p, { replace: true });
  };

  // Reordering is local to the listings already fetched, so it lands at once
  // instead of spending another metered search.
  const changeSort = (next: string) => {
    const p = new URLSearchParams(params);
    if (isSortKey(next) && next !== DEFAULT_SORT) p.set("sort", next); else p.delete("sort");
    setParams(p, { replace: true });
  };

  const listings = useMemo(
    () => sortListings(data?.listings ?? [], sort),
    [data?.listings, sort],
  );

  // What a listing card carries onto the detail page: the search that found it,
  // and the order it was found in, so "Back to results" returns to the list the
  // visitor left rather than resetting to nearest-first.
  const listingSearch = useMemo(() => {
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    if (sort !== DEFAULT_SORT) p.set("sort", sort);
    const s = p.toString();
    return s ? `?${s}` : "";
  }, [query, sort]);

  const heading = useMemo(() => {
    if (!query) return null;
    if (!data) return null;
    if (!data.configured) return null;
    const where = data.place?.label ? ` near ${data.place.label}` : "";
    if (!listings.length) return `No electrified vehicles found${where}`;
    const total = data.total ?? listings.length;
    // The endpoint caps what it returns, so any order other than nearest sorts
    // that cap rather than the whole radius. Say so, instead of implying the
    // cheapest car within 250 miles is the one on screen.
    const capped = total > listings.length ? ` · showing the ${listings.length} nearest` : "";
    return `${total} electrified ${total === 1 ? "vehicle" : "vehicles"}${where}${capped}`;
  }, [data, listings.length, query]);

  return (
    <div className="min-h-screen flex flex-col">
      {!embed && <Navbar />}
      <main className={`flex-1 pb-16 ${embed ? "pt-8" : "pt-28"}`}>
        <div className="container px-4 max-w-6xl">
          <header className="text-center mb-8">
            <h1 className="font-charge text-4xl md:text-5xl text-foreground">EV Marketplace</h1>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
              Electric and plug-in hybrid vehicles for sale near you — with what each one
              actually costs to run, and the incentives it may qualify for.
            </p>
          </header>

          <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder="ZIP code, city, state or address"
                aria-label="Search location"
                maxLength={MAX_QUERY}
                className="pl-9 h-12 rounded-xl"
              />
            </div>
            <Button type="submit" className="h-12 rounded-xl px-6" disabled={!typed.trim()}>
              {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
            </Button>
          </form>

          <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
            <span className="text-sm text-muted-foreground mr-1">Within</span>
            {RADII.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRadius(r === radius ? null : r)}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  radius === r
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {r} mi
              </button>
            ))}
          </div>

          {error && (
            <p className="text-center text-sm text-destructive mb-6">{(error as Error).message}</p>
          )}

          {data && !data.configured && (
            <div className="max-w-2xl mx-auto rounded-2xl border border-border bg-card p-6 text-center">
              <Info className="w-6 h-6 mx-auto mb-3 text-muted-foreground" />
              <p className="font-semibold text-foreground">The marketplace isn't connected yet.</p>
              <p className="text-sm text-muted-foreground mt-1.5">
                Listings need a vehicle inventory provider. Once the key is configured
                this page will show real vehicles for sale near you.
              </p>
            </div>
          )}

          {(heading || listings.length > 1) && (
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <p className="text-sm text-muted-foreground">{heading}</p>
              {listings.length > 1 && (
                <Select value={sort} onValueChange={changeSort}>
                  <SelectTrigger className="h-10 w-[200px] rounded-xl" aria-label="Sort listings">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {listings.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((l) => <ListingCard key={l.id} listing={l} search={listingSearch} />)}
            </div>
          )}

          {!query && (
            <p className="text-center text-muted-foreground">
              Enter a location above to see what's for sale nearby.
            </p>
          )}
        </div>
      </main>
      {!embed && <Footer />}
    </div>
  );
};

export default Marketplace;
