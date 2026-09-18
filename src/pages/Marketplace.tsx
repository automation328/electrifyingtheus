import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search, Loader2, Info, SlidersHorizontal, X, CarFront, ChevronLeft, ChevronRight,
} from "lucide-react";
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
  sortListings, isSortKey, isProviderSorted,
  SORT_OPTIONS, DEFAULT_SORT, type SortKey,
} from "@/lib/marketplace-sort";
import { MAX_MARKETPLACE_PAGE } from "@/lib/marketplace-types";
import {
  readFilters, writeFilters, serverFilters, applyFilters, activeFilterCount,
  localFilterCount, filterChips, EMPTY_FILTERS, type FilterState,
} from "@/lib/marketplace-filters";
import { catalogMakes, catalogModelsFor } from "@/lib/marketplace-link";

const MAX_QUERY = 120;
/** Radix selects cannot hold an empty value, so "no filter" needs a token. */
const ANY = "__any__";
/** The Leaf and the i-MiEV, the first EVs anyone was selling in numbers. */
const FIRST_EV_YEAR = 2011;

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
  // Clamped to the same ceiling the endpoint enforces, so a hand-typed ?page=900
  // asks for page 50 once instead of paying for it on every render.
  const page = Math.min(Math.max(Number(params.get("page")) || 1, 1), MAX_MARKETPLACE_PAGE);
  const filters = useMemo(() => readFilters(params), [params]);

  useEffect(() => { setTyped(urlQuery); setQuery(urlQuery); }, [urlQuery]);

  // Price and year are provider parameters, so they change WHICH listings come
  // back. Memoised because the object is part of the query cache key.
  const upstream = useMemo(() => serverFilters(filters), [filters]);
  // The endpoint takes our own sort key and does the translation to the
  // provider's vocabulary itself. Sending the translated value instead would
  // fail its guard and silently drop the sort — which is the whole request.
  const { data, isFetching, error } = useMarketplace(
    query, radius, upstream, isProviderSorted(sort) ? sort : undefined, page,
  );

  /** Every change except paging invalidates the page number: page 4 of the old
   *  search is not page 4 of the new one. */
  const patchParams = (mutate: (p: URLSearchParams) => void, keepPage = false) => {
    const next = new URLSearchParams(params);
    mutate(next);
    if (!keepPage) next.delete("page");
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

  const changeFilters = (next: FilterState) => {
    const written = writeFilters(params, next);
    written.delete("page");
    setParams(written, { replace: true });
  };

  const changePage = (next: number) => {
    const target = Math.min(Math.max(next, 1), MAX_MARKETPLACE_PAGE);
    if (target === page) return;
    patchParams((p) => { if (target > 1) p.set("page", String(target)); else p.delete("page"); }, true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFilters = () => changeFilters(EMPTY_FILTERS);

  const found = useMemo(() => data?.listings ?? [], [data?.listings]);
  const matched = useMemo(() => applyFilters(found, filters), [found, filters]);
  const listings = useMemo(() => sortListings(matched, sort), [matched, sort]);

  const chips = useMemo(() => filterChips(filters), [filters]);
  const activeCount = activeFilterCount(filters);
  // Only filters applied here can hide a listing the search returned; make,
  // model, price and year change what the search returns in the first place.
  const localCount = localFilterCount(filters);

  // Options come from the catalog, not from the listings on screen: make and
  // model are now filters the provider applies, so a page narrowed to Nissan
  // contains no evidence that Tesla exists and facet-built options would strand
  // the visitor inside whichever make they picked first.
  const makeValue = filters.makes.length === 1 ? filters.makes[0] : ANY;
  const makeOptions = useMemo(() => catalogMakes(), []);
  const modelOptions = useMemo(
    () => catalogModelsFor(makeValue === ANY ? undefined : makeValue),
    [makeValue],
  );
  const modelValue = filters.models.length === 1 ? filters.models[0] : ANY;

  const changeMake = (next: string) =>
    // A model belongs to a make, so changing the make drops a model chosen
    // under the old one rather than leaving a pair that matches nothing.
    changeFilters({ ...filters, makes: next === ANY ? [] : [next], models: [] });

  const changeModel = (next: string) =>
    changeFilters({ ...filters, models: next === ANY ? [] : [next] });

  // Years run from the first mass-market EV to next year's plate, newest first.
  // Not facets: year goes upstream, so offering only the years on this page
  // would hide the ones a new search would actually find.
  const yearOptions = useMemo(() => {
    const newest = new Date().getFullYear() + 1;
    return Array.from({ length: newest - FIRST_EV_YEAR + 1 }, (_, i) => newest - i);
  }, []);
  const yearValue = filters.yearMin != null && filters.yearMin === filters.yearMax
    ? String(filters.yearMin)
    : ANY;

  const changeYear = (next: string) =>
    changeFilters({
      ...filters,
      yearMin: next === ANY ? undefined : Number(next),
      yearMax: next === ANY ? undefined : Number(next),
    });

  // What a card carries onto the detail page. The detail page has no by-id
  // endpoint upstream: it re-runs this exact search and finds the listing in the
  // results. So everything that decides which listings come back has to travel
  // — the place, the radius, the upstream filters, the order AND the page. Drop
  // any one of them and a car found on page 3 reads as "no longer available".
  const listingSearch = useMemo(() => {
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    if (radius) p.set("radius", String(radius));
    if (sort !== DEFAULT_SORT) p.set("sort", sort);
    if (page > 1) p.set("page", String(page));
    for (const [key, value] of Object.entries(upstream)) {
      // Arrays are the make and model lists. An empty one is not a filter, and
      // String([]) would write "makes=" onto every card link ever built.
      if (Array.isArray(value)) {
        if (value.length) p.set(key, value.join(","));
      } else if (value != null) {
        p.set(key, String(value));
      }
    }
    const s = p.toString();
    return s ? `?${s}` : "";
  }, [page, query, radius, sort, upstream]);

  // Pages of provider matches, counted server-side where the real page size is
  // known. It counts listings the provider matched, not cars we verified as
  // electrified, so it is shown next to the pager and never next to the count
  // of vehicles on screen.
  const pageCount = data?.pageCount;
  const paged = Boolean(data?.hasMore) || page > 1;

  const heading = useMemo(() => {
    if (!query || !data?.configured) return null;
    const where = data.place?.label ? ` near ${data.place.label}` : "";
    if (localCount > 0) {
      return `${listings.length} of ${found.length} on this page match your filters`;
    }
    // Verification can empty a page while other pages still hold cars, so an
    // empty page says "this page", not "nowhere near you".
    if (!listings.length) {
      return paged
        ? "No electrified vehicles on this page"
        : `No electrified vehicles found${where}`;
    }
    const count = `${listings.length} electrified ${listings.length === 1 ? "vehicle" : "vehicles"}`;
    return paged ? `${count}${where} · page ${page}` : `${count}${where}`;
  }, [data, found.length, listings.length, localCount, page, paged, query]);

  const panel = (
    <FilterPanel
      state={filters}
      onChange={changeFilters}
      onClear={clearFilters}
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
          <header className="mb-6 max-w-2xl">
            <h1 className="font-charge text-3xl text-foreground md:text-4xl">EV Marketplace</h1>
            <p className="mt-2 text-muted-foreground">
              Electric and plug-in hybrid vehicles for sale near you — with what each one
              actually costs to run, and the incentives it may qualify for.
            </p>
          </header>

          {/* What car, on the left; where, on the right. The two questions a
              shopper actually arrives with, in the order they ask them. */}
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <Select value={makeValue} onValueChange={changeMake}>
                <SelectTrigger className="h-12 w-full rounded-xl sm:w-48" aria-label="Make">
                  <SelectValue placeholder="All makes" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value={ANY}>All makes</SelectItem>
                  {makeOptions.map((make) => (
                    <SelectItem key={make} value={make}>{make}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={modelValue} onValueChange={changeModel}>
                <SelectTrigger className="h-12 w-full rounded-xl sm:w-52" aria-label="Model">
                  <SelectValue placeholder="All models" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value={ANY}>All models</SelectItem>
                  {modelOptions.map((model) => (
                    <SelectItem key={model} value={model}>{model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={yearValue} onValueChange={changeYear}>
                <SelectTrigger className="h-12 w-full rounded-xl sm:w-36" aria-label="Year">
                  <SelectValue placeholder="All years" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  <SelectItem value={ANY}>All years</SelectItem>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <form
              onSubmit={submit}
              className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:shrink-0"
            >
              <div className="relative flex-1 lg:w-80">
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
                {isFetching ? <Loader2 className="h-4 w-4 animate-spin" aria-label="Searching" /> : "Zip Code"}
              </Button>
            </form>
          </div>

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

                {/* An order the provider cannot apply is applied here, to the
                    page it chose — worth saying once there is more than one
                    page, because it is the difference between "the closest for
                    50 miles" and "the closest of these". */}
                {paged && listings.length > 0 && !isProviderSorted(sort) && (
                  <p className="mt-4 text-xs text-muted-foreground">
                    {SORT_OPTIONS.find((o) => o.value === sort)?.label} orders this page.
                    Sorting by price, mileage or year searches the whole area.
                  </p>
                )}

                {/* Outside the results block on purpose: our electrified check
                    can empty a page the provider filled, and that is exactly
                    when someone needs the way back. */}
                {paged && (
                  <nav
                    className="mt-8 flex items-center justify-center gap-3"
                    aria-label="Result pages"
                  >
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => changePage(page - 1)}
                      disabled={page <= 1 || isFetching}
                    >
                      <ChevronLeft className="mr-1 h-4 w-4" aria-hidden />
                      Previous
                    </Button>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      Page {page}{pageCount && pageCount > 1 ? ` of ${pageCount}` : ""}
                    </span>
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => changePage(page + 1)}
                      disabled={!data?.hasMore || isFetching}
                    >
                      Next
                      <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
                    </Button>
                  </nav>
                )}

                {noResults && (
                  <div className="rounded-2xl border border-dashed border-border bg-card/50 p-10 text-center">
                    <CarFront className="mx-auto mb-3 h-8 w-8 text-muted-foreground" aria-hidden />
                    <p className="font-semibold text-foreground">
                      {activeCount > 0
                        ? "No vehicles match these filters"
                        : paged
                          ? "Nothing electrified on this page"
                          : "Nothing electrified for sale here yet"}
                    </p>
                    {/* Which advice is true depends on WHERE the filter ran.
                        Make, model, price and year narrowed the search itself,
                        so another page holds nothing new; the rest were applied
                        to this page, where another page might. */}
                    <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
                      {activeCount > localCount
                        ? "This search came back empty. Loosen a filter or widen the distance — other pages hold the same filters."
                        : localCount > 0
                          ? "These filters apply to the page you are on. Loosen one, widen the distance, or try another page."
                          : paged
                            ? "Dealers list petrol cars under these model names too, and we drop those. Try the next page."
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
