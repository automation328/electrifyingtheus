import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Loader2, Info, SlidersHorizontal, X, CarFront } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { FilterPanel } from "@/components/marketplace/FilterPanel";
import { ListingCard, ListingCardSkeleton } from "@/components/marketplace/ListingCard";
import { useEmbedFrame } from "@/hooks/useEmbedFrame";
import { useMarketplace } from "@/hooks/use-marketplace";
import {
  sortListings, isSortKey, SORT_OPTIONS, DEFAULT_SORT, type SortKey,
} from "@/lib/marketplace-sort";
import {
  readFilters, writeFilters, serverFilters, applyFilters, activeFilterCount,
  filterChips, EMPTY_FILTERS, type FilterState,
} from "@/lib/marketplace-filters";

const MAX_QUERY = 120;

const Marketplace = () => {
  const [params, setParams] = useSearchParams();
  const embed = params.get("embed") === "1";
  useEmbedFrame(embed);

  const urlQuery = (params.get("q") || "").trim().slice(0, MAX_QUERY);
  const [typed, setTyped] = useState(urlQuery);
  const [query, setQuery] = useState(urlQuery);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // The URL is the source of truth for everything that shapes the results, so a
  // shared or embedded link reopens the search exactly as it was sent.
  const radius = Number(params.get("radius")) || null;
  const sortParam = params.get("sort");
  const sort: SortKey = isSortKey(sortParam) ? sortParam : DEFAULT_SORT;
  const filters = useMemo(() => readFilters(params), [params]);

  useEffect(() => { setTyped(urlQuery); setQuery(urlQuery); }, [urlQuery]);

  // Price and year are provider parameters, so they change WHICH listings come
  // back. Memoised because the object is part of the query cache key.
  const upstream = useMemo(() => serverFilters(filters), [filters]);
  const { data, isFetching, error } = useMarketplace(query, radius, upstream);

  const patchParams = (mutate: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(params);
    mutate(next);
    setParams(next, { replace: true });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = typed.trim().slice(0, MAX_QUERY);
    setQuery(next);
    patchParams((p) => { if (next) p.set("q", next); else p.delete("q"); });
  };

  const changeSort = (next: string) =>
    patchParams((p) => {
      if (isSortKey(next) && next !== DEFAULT_SORT) p.set("sort", next); else p.delete("sort");
    });

  const changeRadius = (next: number | null) =>
    patchParams((p) => { if (next) p.set("radius", String(next)); else p.delete("radius"); });

  const changeFilters = (next: FilterState) =>
    setParams(writeFilters(params, next), { replace: true });

  const clearFilters = () => changeFilters(EMPTY_FILTERS);

  const found = useMemo(() => data?.listings ?? [], [data?.listings]);
  const matched = useMemo(() => applyFilters(found, filters), [found, filters]);
  const listings = useMemo(() => sortListings(matched, sort), [matched, sort]);

  const chips = useMemo(() => filterChips(filters), [filters]);
  const activeCount = activeFilterCount(filters);

  // What a card carries onto the detail page: the search that found it and the
  // order it was found in, so "Back to results" returns to the list as left.
  const listingSearch = useMemo(() => {
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    if (sort !== DEFAULT_SORT) p.set("sort", sort);
    const s = p.toString();
    return s ? `?${s}` : "";
  }, [query, sort]);

  const heading = useMemo(() => {
    if (!query || !data?.configured) return null;
    const where = data.place?.label ? ` near ${data.place.label}` : "";
    if (activeCount > 0) {
      return `${listings.length} of ${found.length} vehicles${where} match your filters`;
    }
    if (!listings.length) return `No electrified vehicles found${where}`;
    const total = data.total ?? listings.length;
    // The endpoint returns a capped page of the nearest matches, so any order
    // other than closest-first sorts that page rather than the whole radius.
    // Say so, instead of implying the cheapest car for 250 miles is on screen.
    const capped = total > listings.length ? ` · showing the ${listings.length} closest` : "";
    return `${total} electrified ${total === 1 ? "vehicle" : "vehicles"}${where}${capped}`;
  }, [activeCount, data, found.length, listings.length, query]);

  const panel = (
    <FilterPanel
      state={filters}
      onChange={changeFilters}
      onClear={clearFilters}
      listings={found}
      radius={radius}
      onRadiusChange={changeRadius}
      placeLabel={data?.place?.label}
    />
  );

  const showSkeletons = isFetching && !found.length;
  const noResults = Boolean(query) && data?.configured && !listings.length && !isFetching;

  return (
    <div className="flex min-h-screen flex-col">
      {!embed && <Navbar />}
      <main className={`flex-1 pb-16 ${embed ? "pt-6" : "pt-24"}`}>
        <div className="container max-w-7xl px-4">
          <header className="mb-6 max-w-3xl">
            <h1 className="font-charge text-3xl text-foreground md:text-4xl">EV Marketplace</h1>
            <p className="mt-2 text-muted-foreground">
              Electric and plug-in hybrid vehicles for sale near you — with what each one
              actually costs to run, and the incentives it may qualify for.
            </p>
          </header>

          <form onSubmit={submit} className="mb-6 flex flex-col gap-3 sm:flex-row sm:max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder="ZIP code, city, state or address"
                aria-label="Search location"
                maxLength={MAX_QUERY}
                className="h-12 rounded-xl pl-9"
              />
            </div>
            <Button type="submit" className="h-12 rounded-xl px-6" disabled={!typed.trim()}>
              {isFetching ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Searching" /> : "Search"}
            </Button>
          </form>

          {error && (
            <p className="mb-6 text-sm text-destructive">{(error as Error).message}</p>
          )}

          {data && !data.configured ? (
            <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-card p-6 text-center">
              <Info className="mx-auto mb-3 h-6 w-6 text-muted-foreground" aria-hidden />
              <p className="font-semibold text-foreground">The marketplace isn't connected yet.</p>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Listings need a vehicle inventory provider. Once the key is configured
                this page will show real vehicles for sale near you.
              </p>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[272px_minmax(0,1fr)]">
              <aside className="hidden lg:block">
                <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1">
                  {panel}
                </div>
              </aside>

              <section aria-label="Search results">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                      <SheetTrigger asChild>
                        <Button variant="outline" className="h-10 rounded-xl lg:hidden">
                          <SlidersHorizontal className="mr-2 h-4 w-4" aria-hidden />
                          Filters{activeCount > 0 ? ` (${activeCount})` : ""}
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="left" className="w-[88vw] max-w-sm overflow-y-auto">
                        <SheetHeader className="mb-4 text-left">
                          <SheetTitle className="font-charge">Filter listings</SheetTitle>
                        </SheetHeader>
                        {panel}
                        <Button
                          className="mt-6 h-11 w-full rounded-xl"
                          onClick={() => setFiltersOpen(false)}
                        >
                          Show {listings.length} {listings.length === 1 ? "vehicle" : "vehicles"}
                        </Button>
                      </SheetContent>
                    </Sheet>

                    {heading && <p className="text-sm text-muted-foreground">{heading}</p>}
                  </div>

                  {(listings.length > 1 || activeCount > 0) && (
                    <div className="flex items-center gap-2">
                      <span className="hidden text-sm text-muted-foreground sm:inline">Sort by</span>
                      <Select value={sort} onValueChange={changeSort}>
                        <SelectTrigger className="h-10 w-[210px] rounded-xl" aria-label="Sort listings">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="end">
                          {SORT_OPTIONS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {chips.length > 0 && (
                  <ul className="mb-4 flex flex-wrap gap-2">
                    {chips.map((chip) => (
                      <li key={chip.id}>
                        <button
                          type="button"
                          onClick={() => changeFilters(chip.next)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-sm text-primary transition-colors hover:bg-primary/10"
                        >
                          {chip.label}
                          <X className="h-3.5 w-3.5" aria-hidden />
                          <span className="sr-only">Remove filter</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {showSkeletons && (
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }, (_, i) => <ListingCardSkeleton key={i} />)}
                  </div>
                )}

                {listings.length > 0 && (
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {listings.map((l) => (
                      <ListingCard key={l.id} listing={l} search={listingSearch} />
                    ))}
                  </div>
                )}

                {noResults && (
                  <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
                    <CarFront className="mx-auto mb-3 h-8 w-8 text-muted-foreground" aria-hidden />
                    <p className="font-semibold text-foreground">
                      {activeCount > 0
                        ? "No vehicles match these filters"
                        : "Nothing electrified for sale here yet"}
                    </p>
                    <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
                      {activeCount > 0
                        ? "Inventory this close changes weekly. Loosen a filter or widen the distance."
                        : "Try a wider distance, or a larger city nearby."}
                    </p>
                    {activeCount > 0 && (
                      <Button variant="outline" className="mt-5 rounded-xl" onClick={clearFilters}>
                        Clear all filters
                      </Button>
                    )}
                  </div>
                )}

                {!query && (
                  <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
                    <Search className="mx-auto mb-3 h-8 w-8 text-muted-foreground" aria-hidden />
                    <p className="font-semibold text-foreground">Start with a location</p>
                    <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
                      Enter a ZIP code or a city above to see the electric and plug-in
                      hybrid vehicles for sale near you.
                    </p>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </main>
      {!embed && <Footer />}
    </div>
  );
};

export default Marketplace;
