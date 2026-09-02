import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { MapPin, Search, ExternalLink, Plug, Zap, Gauge, Locate, Navigation, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEmbedFrame } from "@/hooks/useEmbedFrame";
import { Button } from "@/components/ui/button";
import ShareGate from "@/components/forms/ShareGate";
import {
  fetchStations, kindOf, connectorLabel, portSummary, distanceLabel,
  KIND_COLORS, KIND_LABELS, type LevelFilter, type Station,
} from "@/lib/stations";

// Leaflet plus its CSS is ~45 kB gzipped and this is the only page that
// draws a map, so it loads on its own, after the page has rendered.
const ChargerMap = lazy(() => import("@/components/ChargerMap"));

// The longest search worth carrying. Matches the cap the proxy applies.
const MAX_QUERY = 120;

/**
 * A shared link reopens the page on the same location: /find-a-charger?q=Atlanta,%20GA
 *
 * `zip` is read too, and not only for tidiness — every link shared before the
 * box took free text carries it, and stripping the parameter would land those
 * visitors on a blank map.
 */
const initialQueryFromUrl = (): string => {
  if (typeof window === "undefined") return "";
  const p = new URLSearchParams(window.location.search);
  return (p.get("q") || p.get("zip") || "").trim().slice(0, MAX_QUERY);
};

// Official Alternative Fueling Station Locator (authoritative source).
const STATION_LOCATOR_URL = "https://afdc.energy.gov/fuels/electricity-locations#/find/nearest?fuel=ELEC";

// The question this page exists to answer: fast charger, or Level 2?
const LEVELS: { key: LevelFilter; label: string; hint: string }[] = [
  { key: "all", label: "All chargers", hint: "Every public station nearby" },
  { key: "dc_fast", label: "DC fast", hint: "Road-trip speed — 10–80% in 20–40 min" },
  { key: "level2", label: "Level 2", hint: "Everyday charging — 20–40 miles of range per hour" },
];

// Miles. 15 covers a metro area; the empty state offers to widen to 50 for the
// rural case, where the nearest charger can be a county away.
const DEFAULT_RADIUS = 15;
const WIDE_RADIUS = 50;

const CONNECTORS = [
  { icon: Plug, title: "Level 2 (240V)", desc: "Everyday charging at home, work, and public lots — ~20–40 miles of range per hour." },
  { icon: Gauge, title: "DC Fast Charging", desc: "Highway and road-trip charging — roughly 10–80% in 20–40 minutes." },
  { icon: Zap, title: "NACS vs CCS", desc: "The U.S. is standardizing on NACS (Tesla-style); CCS remains widely supported. Many stations offer both." },
];

const FindACharger = () => {
  // `?embed=1` renders the tool chrome-free for iframing on third-party sites.
  const embed = typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("embed") === "1";
  useEmbedFrame(embed);
  const urlQuery = initialQueryFromUrl();
  const [typed, setTyped] = useState(urlQuery);
  const [query, setQuery] = useState(urlQuery); // the applied search term that drives the map
  const [detected, setDetected] = useState(false);
  const [detecting, setDetecting] = useState(!urlQuery);
  const [level, setLevel] = useState<LevelFilter>("all");
  // null = let the server size the search from what it matched. A number only
  // once the visitor has asked for a wider one.
  const [radius, setRadius] = useState<number | null>(null);
  const searched = query.trim().length > 0;
  // Which station's popup the map should open — set by clicking a list card.
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // The stations themselves, from AFDC via our own proxy. Keyed on everything
  // that changes the answer, so switching filters back and forth is instant and
  // costs no extra upstream calls.
  const stationsQ = useQuery({
    queryKey: ["stations", query, level, radius],
    queryFn: () => fetchStations({ q: query }, level, radius),
    enabled: searched,
    staleTime: 30 * 60 * 1000,
    retry: 1,
    // Hold the previous results on screen while the next set loads, but only
    // while the PLACE is the same. Without it the map unmounts on every pill
    // click, throwing away the tiles and redrawing from scratch. Carrying it
    // across a NEW search is a different thing entirely: the response now
    // carries the matched place's name and radius, so the toolbar would keep
    // naming the old city, and the "widen the search" offer would be answering
    // for a search nobody is running any more.
    placeholderData: (prev, prevQuery) =>
      (prevQuery?.queryKey as unknown[] | undefined)?.[1] === query ? prev : undefined,
  });
  const stations: Station[] = useMemo(() => stationsQ.data?.stations ?? [], [stationsQ.data]);

  // Counts for the pills. They come from the unfiltered list, so they read as
  // "what is out there", not "what is left after the filter I already applied".
  const allQ = useQuery({
    queryKey: ["stations", query, "all", radius],
    queryFn: () => fetchStations({ q: query }, "all", radius),
    enabled: searched,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
  // The map needs somewhere to point even when the filtered request fails, so the
  // center comes from whichever query has an answer.
  const center = stationsQ.data?.center ?? allQ.data?.center;

  const counts = useMemo(() => {
    const all = allQ.data?.stations ?? [];
    return {
      all: all.length,
      dc_fast: all.filter((s) => s.dcFast > 0).length,
      level2: all.filter((s) => s.level2 > 0).length,
    };
  }, [allQ.data]);

  // Auto-detect the visitor's ZIP from their IP and center the map there — unless
  // a ZIP arrived in the URL (a shared link), which always wins.
  useEffect(() => {
    if (urlQuery) return;
    let cancelled = false;
    (async () => {
      try {
        let postal = "";
        // Primary: our own edge-geo endpoint (Vercel headers — reliable, no rate limit).
        try {
          const g = await fetch("/api/geo");
          if (g.ok) {
            const gd = await g.json();
            if (gd?.country === "US") postal = String(gd?.postal ?? "").replace(/\D/g, "").slice(0, 5);
          }
        } catch { /* fall through to the third-party lookup */ }
        // Fallback: third-party IP lookup.
        if (postal.length !== 5 && !cancelled) {
          try {
            const res = await fetch("https://ipapi.co/json/");
            if (res.ok) {
              const data = await res.json();
              if (data?.country_code === "US") postal = String(data?.postal ?? "").replace(/\D/g, "").slice(0, 5);
            }
          } catch { /* manual entry */ }
        }
        if (cancelled) return;
        if (postal.length === 5) {
          setTyped(postal);
          setQuery(postal);
          setDetected(true);
        }
      } catch {
        /* blocked / offline — visitor can type a ZIP manually */
      } finally {
        if (!cancelled) setDetecting(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = typed.trim().slice(0, MAX_QUERY);
    setQuery(next);
    setDetected(false);
    // A new place gets its own radius back — the server sizes it from what it
    // matched — and the old station's popup has nothing to do with it.
    setRadius(null);
    setSelectedId(null);
    // Reflect the specific result in the URL so it can be shared / reopened.
    // The legacy `zip` key is cleared so a reopened link cannot carry both.
    if (typeof window !== "undefined") {
      const u = new URL(window.location.href);
      u.searchParams.delete("zip");
      if (next) u.searchParams.set("q", next); else u.searchParams.delete("q");
      window.history.replaceState({}, "", u.toString());
    }
  };

  // What the geocoder matched, which is what the page should name back. Falls
  // back to the raw typing while the first request is still in flight.
  const resolved = stationsQ.data ?? allQ.data;
  const placeLabel = resolved?.label || query;
  // Miles actually searched, which the server decides unless the visitor has
  // overridden it.
  const shownRadius = resolved?.radius ?? radius ?? DEFAULT_RADIUS;
  // A state-sized search has already swept a few hundred miles; offering to
  // widen it to fifty would narrow it.
  const canWiden = resolved?.kind !== "state" && shownRadius < WIDE_RADIUS;

  // Shareable link + Google Maps deep link for the currently shown location.
  const shareUrl = `/find-a-charger${query ? `?q=${encodeURIComponent(query)}` : ""}`;
  const shareTitle = query
    ? `EV charging stations near ${query} — Electrifying the US`
    : "Find EV charging stations near you — Electrifying the US";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {!embed && <Navbar />}
      <main className={`flex-1 pb-16 ${embed ? "pt-8" : "pt-28"}`}>
        {/* Header */}
        <section className="relative overflow-hidden">
          {!embed && <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-secondary/5 to-transparent" aria-hidden />}
          <div className="container relative z-10 px-4 max-w-5xl">
            <div className="text-center max-w-3xl mx-auto">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
                <MapPin className="w-3.5 h-3.5" /> Charging Map
              </span>
              <h1 className="text-4xl md:text-6xl font-bold font-display text-foreground mb-4">
                Find an EV <span className="text-gradient-primary">Charger</span> Near You
              </h1>
              <p className="text-muted-foreground">
                There are <strong className="font-semibold text-foreground">250,000+ EV Charging Ports</strong> across the
                country with more coming online every week. This tool helps you locate public EV charging stations across
                the U.S. You can search any ZIP code, city, state, or address to explore charging nearby.
              </p>
            </div>

            {/* Search */}
            <form onSubmit={onSubmit} className="mt-8 max-w-xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    value={typed}
                    onChange={(e) => setTyped(e.target.value.slice(0, MAX_QUERY))}
                    // No inputMode="numeric": that hands a phone a keypad with no
                    // letters on it, which is its own way of making the box
                    // ZIP-only however permissive the code above is.
                    inputMode="search"
                    maxLength={MAX_QUERY}
                    placeholder={detecting ? "Detecting your location…" : "ZIP, city, state, or address"}
                    aria-label="ZIP, city, state, or address"
                    className="w-full rounded-xl border border-border bg-card pl-10 pr-3 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <Button type="submit" variant="hero" size="lg" className="rounded-xl px-6">
                  <Search className="w-4 h-4" /> Search
                </Button>
              </div>
              {detected && typed && (
                <p className="mt-2 text-xs text-secondary flex items-center justify-center gap-1.5">
                  <Locate className="w-3.5 h-3.5" /> Showing chargers near your detected area ({typed}).
                </p>
              )}
            </form>
          </div>
        </section>

        {/* Map */}
        <div className="container px-4 max-w-5xl mt-10">
          {/* Result toolbar — what was searched, and a link to share it. */}
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              {searched
                ? <>Showing chargers near <span className="font-semibold text-foreground">{placeLabel}</span></>
                : "Showing chargers near you"}
            </p>
            <div className="flex items-center gap-2">
              <ShareGate
                url={shareUrl}
                title={shareTitle}
                summary={query ? `EV charging near ${query}` : "EV charging near me"}
                description="See public EV charging stations on the Electrifying the US charging map — this link reopens the map at the same location."
                formType="charger-share"
                variant="label"
                label="Share this map"
                stopNav={false}
              />
            </div>
          </div>
          {/* The band above the map: what you can change on the left, what you
              are looking at on the right.

              The filter is the one control on this page, so it gets the size and
              the leading edge. Its pills carry counts from the UNFILTERED search,
              so "DC fast 41" answers the question before you click it, and a
              single track reads as one switch with three positions rather than
              three loose buttons. Opposite it, the pin key and the result count
              read together as the caption for the map below — the count last and
              largest, because it is the answer. Stacked on a phone, where there
              is no room for two columns. */}
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
            <div className="inline-flex flex-wrap gap-1.5 rounded-full border border-border bg-card/70 p-1.5 shadow-card">
              {LEVELS.map((l) => {
                const on = level === l.key;
                return (
                  <button
                    key={l.key}
                    type="button"
                    onClick={() => { setLevel(l.key); setSelectedId(null); }}
                    title={l.hint}
                    aria-pressed={on}
                    className={`inline-flex items-center gap-2.5 rounded-full px-5 md:px-7 py-2.5 md:py-3 text-sm md:text-base font-semibold transition-all ${
                      on
                        ? "gradient-primary text-primary-foreground shadow-card"
                        : "text-muted-foreground hover:bg-muted hover:text-primary"
                    }`}
                  >
                    {l.label}
                    {searched && !allQ.isLoading && (
                      <span className={`text-xs font-bold tabular-nums rounded-full px-2 py-0.5 ${
                        on ? "bg-white/20" : "bg-muted text-foreground"}`}>{counts[l.key]}</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-1.5 lg:items-end">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                {(["dc", "both", "l2"] as const).map((k) => (
                  <span key={k} className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full" style={{ background: KIND_COLORS[k] }} />
                    {KIND_LABELS[k]}
                  </span>
                ))}
              </div>
              {searched && stationsQ.isSuccess && stations.length > 0 && (
                <h2 className="font-display font-bold text-foreground text-lg md:text-xl">
                  {stations.length} station{stations.length === 1 ? "" : "s"} within {shownRadius} miles
                </h2>
              )}
            </div>
          </div>

          <div className="rounded-3xl overflow-hidden border border-border shadow-elevated bg-muted relative">
            {searched && center ? (
              <Suspense fallback={<div className="h-[460px] md:h-[560px] grid place-items-center text-sm text-muted-foreground">Loading the map...</div>}>
                <ChargerMap
                  stations={stations}
                  center={center}
                  selectedId={selectedId}
                  className="w-full h-[460px] md:h-[560px] z-0"
                />
              </Suspense>
            ) : (
              <div className="h-[460px] md:h-[560px] grid place-items-center px-6 text-center">
                {stationsQ.isError || allQ.isError ? (
                  <p className="text-sm text-muted-foreground max-w-sm">
                    {(stationsQ.error as Error)?.message ?? "Couldn't load charging stations."}{" "}
                    The official locator below has the same data.
                  </p>
                ) : stationsQ.isLoading || detecting ? (
                  <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Finding chargers...
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Enter a ZIP code, city, state, or address above to map the public charging stations around it.
                  </p>
                )}
              </div>
            )}
            {stationsQ.isFetching && center && (
              <span className="absolute top-3 right-3 z-[400] inline-flex items-center gap-1.5 rounded-full bg-card/95 border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-card">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Updating
              </span>
            )}
          </div>

          {/* Station list. The map answers "where", this answers "what will I
              find when I get there" - ports, connectors, network. */}
          {searched && stationsQ.isError && (
            <div className="mt-6 rounded-2xl border border-border bg-card p-6 text-center">
              <p className="text-sm text-muted-foreground">
                {(stationsQ.error as Error)?.message ?? "Couldn't load charging stations."}
              </p>
              <Button variant="outline" className="mt-3 rounded-xl" onClick={() => stationsQ.refetch()}>
                Try again
              </Button>
            </div>
          )}

          {searched && stationsQ.isSuccess && (
            stations.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-border bg-card p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No {level === "dc_fast" ? "DC fast chargers" : level === "level2" ? "Level 2 chargers" : "public chargers"} within {shownRadius} miles of {placeLabel}.
                </p>
                {canWiden && (
                  <Button variant="outline" className="mt-3 rounded-xl" onClick={() => setRadius(WIDE_RADIUS)}>
                    Search {WIDE_RADIUS} miles instead
                  </Button>
                )}
              </div>
            ) : (
              <div className="mt-6">
                <ul className="grid sm:grid-cols-2 gap-3">
                  {stations.map((s) => {
                    const kind = kindOf(s);
                    const active = selectedId === s.id;
                    return (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(s.id)}
                          className={`w-full text-left rounded-2xl border bg-card p-4 transition-colors ${
                            active ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/40"
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span className="mt-1 w-3 h-3 rounded-full shrink-0" style={{ background: KIND_COLORS[kind] }} aria-hidden />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline gap-2">
                                <span className="font-semibold text-foreground text-sm truncate">{s.name}</span>
                                <span className="ml-auto text-xs text-muted-foreground shrink-0">{distanceLabel(s.distance)}</span>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">{s.address}, {s.city}</p>
                              <p className="text-xs font-semibold mt-1" style={{ color: KIND_COLORS[kind] }}>
                                {KIND_LABELS[kind]} <span className="font-medium text-muted-foreground">· {portSummary(s)}</span>
                              </p>
                              {(s.connectors.length > 0 || s.network) && (
                                <p className="text-[11px] text-muted-foreground mt-1 truncate">
                                  {s.connectors.map(connectorLabel).join(", ")}
                                  {s.connectors.length > 0 && s.network ? " · " : ""}
                                  {s.network}
                                </p>
                              )}
                              <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                                <Navigation className="w-3 h-3" /> Show on map
                              </span>
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )
          )}

          {/* Official locator CTA */}
          <div className="mt-6 rounded-3xl border border-border bg-card p-6 md:p-7 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="font-display font-bold text-foreground text-lg">Want the full station locator?</h2>
              <p className="text-muted-foreground text-sm mt-1 max-w-xl">
                Filter by connector type, network, and charging speed using the official
                Alternative Fueling Station Locator.
              </p>
            </div>
            <a href={STATION_LOCATOR_URL} target="_blank" rel="noopener noreferrer" className="shrink-0">
              <Button variant="green" className="rounded-xl">
                Open Station Locator <ExternalLink className="w-4 h-4" />
              </Button>
            </a>
          </div>

          {/* Connector primer */}
          <div className="grid sm:grid-cols-3 gap-5 mt-10">
            {CONNECTORS.map((c) => (
              <div key={c.title} className="rounded-2xl border border-border bg-card p-6">
                <span className="grid place-items-center w-11 h-11 rounded-xl gradient-primary mb-4">
                  <c.icon className="w-5 h-5 text-primary-foreground" />
                </span>
                <h3 className="font-bold font-display text-foreground mb-1.5">{c.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
      {embed && (
        <div className="container px-4 max-w-5xl pb-8 text-center">
          <a href="https://electrifyingtheus.com/find-a-charger" target="_blank" rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary">
            Powered by <span className="font-semibold text-foreground">Electrifying the US</span>
          </a>
        </div>
      )}
      {!embed && <Footer />}
    </div>
  );
};

export default FindACharger;
