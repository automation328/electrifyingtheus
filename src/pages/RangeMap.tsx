import { lazy, Suspense, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { BatteryCharging, Car, Gauge, Loader2, MapPin, PlugZap, Search, Snowflake } from "lucide-react";
import Navbar from "@/components/Navbar";
import ShareGate from "@/components/forms/ShareGate";
import Footer from "@/components/Footer";
import { useEmbedFrame } from "@/hooks/useEmbedFrame";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type { RangeRing } from "@/components/RangeCircleMap";
import { importWithRetry } from "@/lib/chunk-retry";
import {
  citiesWithin, detectZip, poisWithin, lookupPlace, modelsOf, RANGE_MAKES, rangeRings, variantLabel, variantsOf, yearsOf, type MapPlace,
} from "@/lib/range-map";

const RangeCircleMap = lazy(() => importWithRetry(() => import("@/components/RangeCircleMap")));

const COLORS = { full: "#1f7a4d", winter: "#0e7490" };

const MAP_HEIGHT = "h-[480px] lg:h-[620px]";

const TRIGGER = "h-12 rounded-xl border-2 border-primary/20 bg-card text-foreground font-semibold shadow-sm transition hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20";

type Status = "idle" | "loading" | "notfound" | "error";

const Field = ({ label, className = "", children }: { label: string; className?: string; children: ReactNode }) => (
  <label className={`grid gap-1.5 text-xs font-bold uppercase tracking-wide text-primary min-w-0 ${className}`}>
    {label}
    {children}
  </label>
);

// A shared link (?make=&model=&year=&v=&charge=&cold=1&at=) reopens the same
// result. Each value is checked against the catalog; a bad one is dropped.
const fromLink = () => {
  const q = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
  const make = RANGE_MAKES.includes(q.get("make") ?? "") ? q.get("make")! : "";
  const modelId = modelsOf(make).some((m) => m.id === q.get("model")) ? q.get("model")! : "";
  const years = yearsOf(modelId);
  const year = years.includes(Number(q.get("year"))) ? Number(q.get("year")) : years[0] ?? 0;
  const v = Number(q.get("v"));
  const variantIdx = Number.isInteger(v) && v >= 0 && v < variantsOf(modelId, year).length ? v : 0;
  const c = Number(q.get("charge"));
  const charge = Number.isInteger(c) && c >= 5 && c <= 100 ? c : 100;
  return { make, modelId, year, variantIdx, charge, deepCold: q.get("cold") === "1", at: (q.get("at") ?? "").trim().slice(0, 120) };
};

const RangeMap = () => {
  // `?embed=1` renders the tool chrome-free for iframing on third-party sites.
  const embed = typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("embed") === "1";
  useEmbedFrame(embed);
  const [link] = useState(fromLink);
  // Nothing is preselected unless a shared link says so.
  const [make, setMake] = useState(link.make);
  const [modelId, setModelId] = useState(link.modelId);
  const [year, setYear] = useState(link.year);
  // Index 0 is the year's lowest EPA rating: the safe default when planning a trip.
  const [variantIdx, setVariantIdx] = useState(link.variantIdx);
  const [charge, setCharge] = useState(link.charge);
  const [deepCold, setDeepCold] = useState(link.deepCold);
  const [typed, setTyped] = useState(link.at);
  const [place, setPlace] = useState<MapPlace | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  const models = useMemo(() => modelsOf(make), [make]);
  const years = useMemo(() => yearsOf(modelId), [modelId]);
  const variants = useMemo(() => variantsOf(modelId, year), [modelId, year]);
  const epaMiles = variants[variantIdx]?.[0] ?? variants[0]?.[0] ?? 0;
  const rings = useMemo(() => rangeRings(epaMiles, charge), [epaMiles, charge]);

  const mapRings: RangeRing[] = useMemo(() => !modelId ? [] : [
    { miles: rings.full, color: COLORS.full, label: "One way" },
    ...(deepCold ? [{ miles: rings.winter, color: COLORS.winter, label: "Deep cold" }] : []),
  ], [modelId, rings, deepCold]);

  const pickModel = (id: string) => {
    setModelId(id);
    setYear(yearsOf(id)[0] ?? 0);
    setVariantIdx(0);
  };
  const pickMake = (m: string) => {
    setMake(m);
    setModelId("");
    setYear(0);
    setVariantIdx(0);
  };

  // Start from the shared link's place, else the visitor's IP location. A place
  // they already searched wins.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const zip = link.at || await detectZip();
      const hit = zip ? await lookupPlace(zip).catch(() => null) : null;
      if (cancelled || !hit) return;
      setPlace((cur) => cur ?? hit);
      setTyped((cur) => cur || zip);
    })();
    return () => { cancelled = true; };
  }, [link.at]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!typed.trim()) { setStatus("notfound"); return; }
    setStatus("loading");
    try {
      const hit = await lookupPlace(typed);
      setPlace(hit);
      setStatus(hit ? "idle" : "notfound");
    } catch {
      setStatus("error");
    }
  };

  const pois = useMemo(() => (place && modelId ? poisWithin(place, rings.full) : []), [place, modelId, rings.full]);
  const cities = useMemo(() => (place && modelId ? citiesWithin(place, rings.full) : []), [place, modelId, rings.full]);

  const modelName = models.find((m) => m.id === modelId)?.model ?? "";
  const carName = `${year > 0 ? `${year} ` : ""}${make} ${modelName}`;

  // Opens the charging map on the place searched here.
  const chargerUrl = place ? `/find-a-charger?q=${encodeURIComponent(typed.trim() || place.label)}` : "/find-a-charger";

  const shareUrl = () => {
    const q = new URLSearchParams({ make, model: modelId, year: String(year), v: String(variantIdx), charge: String(charge) });
    if (deepCold) q.set("cold", "1");
    if (place) q.set("at", typed.trim() || place.label);
    return `/range-map?${q}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {!embed && <Navbar />}
      <main className={`flex-1 pb-16 ${embed ? "pt-8" : "pt-28"}`}>
        <section className="relative overflow-hidden">
          {!embed && <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-secondary/5 to-transparent" aria-hidden />}
          <div className="container relative z-10 px-4 max-w-6xl">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-3">
              <Gauge className="w-3.5 h-3.5" /> Range Map
            </span>
            <h1 className="text-3xl md:text-5xl font-bold font-display text-foreground mb-2">
              See How Far <span className="text-gradient-primary">EVs</span> Can Go on a Single Charge
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Enter a starting place and pick your vehicle to see your driving range as a radius on the map.
              Actual range varies with speed, weather, terrain, cargo, battery age, and heating or A/C use.
            </p>
          </div>
        </section>

        <div className="container px-4 max-w-6xl mt-8 grid gap-4">
          {/* Vehicle */}
          <div className="relative overflow-hidden rounded-3xl border-2 border-primary/25 bg-gradient-to-br from-primary/[0.06] via-card to-secondary/[0.06] p-4 md:p-7 grid gap-6 shadow-elevated">
            <div className="absolute inset-x-0 top-0 h-1.5 gradient-primary" aria-hidden />
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-primary/10">
              <div className="flex items-center gap-3">
                <span className="grid place-items-center w-11 h-11 rounded-xl gradient-primary text-white shadow-card shrink-0">
                  <Car className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="font-display font-bold text-xl text-foreground leading-tight">Choose your EV</h2>
                  <p className="text-xs text-muted-foreground">Pick a make, model, year and version, then set your battery charge.</p>
                </div>
              </div>
              {/* Starting place, on the right of the card title */}
              <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto lg:min-w-[500px]">
                <div className="relative flex-1">
                  <MapPin className="absolute z-10 left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
                  <input
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    inputMode="search"
                    maxLength={120}
                    placeholder="Enter your Address, City, State or Zip code"
                    aria-label="Enter your Address, City, State or Zip code"
                    className="w-full h-12 rounded-xl border-2 border-primary/20 bg-card pl-10 pr-3 text-sm font-semibold text-foreground shadow-sm placeholder:font-normal placeholder:text-muted-foreground outline-none transition hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <Button type="submit" variant="hero" size="lg" className="h-12 rounded-xl px-6" disabled={status === "loading"}>
                  {status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Search
                </Button>
              </form>
            </div>
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-[1fr_1.4fr_0.7fr_1.4fr]">
              <Field label="Make">
                <Select value={make} onValueChange={pickMake}>
                  <SelectTrigger aria-label="Make" className={TRIGGER}><SelectValue placeholder="Select make" /></SelectTrigger>
                  <SelectContent>
                    {RANGE_MAKES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Model">
                <Select value={modelId} onValueChange={pickModel} disabled={!make}>
                  <SelectTrigger aria-label="Model" className={TRIGGER}><SelectValue placeholder="Select model" /></SelectTrigger>
                  <SelectContent>
                    {models.map((m) => <SelectItem key={m.id} value={m.id}>{m.model}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Year">
                <Select value={year ? String(year) : ""} onValueChange={(v) => { setYear(Number(v)); setVariantIdx(0); }} disabled={!years.length}>
                  <SelectTrigger aria-label="Year" className={TRIGGER}><SelectValue placeholder="Year" /></SelectTrigger>
                  <SelectContent>
                    {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Version">
                <Select value={variants.length ? String(variantIdx) : ""} onValueChange={(v) => setVariantIdx(Number(v))} disabled={variants.length < 2}>
                  <SelectTrigger aria-label="Version" className={TRIGGER}><SelectValue placeholder="Version" /></SelectTrigger>
                  <SelectContent>
                    {variants.map((v, i) => <SelectItem key={i} value={String(i)}>{variantLabel(v)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="rounded-2xl bg-card/70 border border-primary/15 p-4 md:px-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
              <div className="grid gap-1.5 flex-1 min-w-0">
                <div className="flex justify-between items-center text-sm font-semibold text-foreground">
                  <span id="charge-label" className="inline-flex items-center gap-1.5"><BatteryCharging className="w-4 h-4 text-primary" aria-hidden /> Battery charge</span>
                  <span className="font-bold text-primary tabular-nums">{charge}%</span>
                </div>
                <Slider
                  value={[charge]} min={10} max={100} step={5}
                  onValueChange={([v]) => setCharge(v)}
                  aria-labelledby="charge-label"
                  className="h-6"
                />
              </div>
              <label className={`flex items-center gap-2.5 h-12 px-4 rounded-xl border-2 text-sm font-semibold cursor-pointer shrink-0 transition ${deepCold ? "border-[#0e7490]/40 bg-[#0e7490]/10 text-[#0e7490]" : "border-primary/20 bg-card text-foreground hover:border-primary/50"}`}>
                <Switch checked={deepCold} onCheckedChange={setDeepCold} />
                <Snowflake className="w-4 h-4" aria-hidden />
                Show Cold Weather Range
              </label>
            </div>
          </div>

          {/* Summary line */}
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-2xl border border-border bg-card px-5 py-4 md:px-6 shadow-sm">
            {!modelId ? <p className="text-base text-muted-foreground">Choose your EV to see its range.</p> : <div className="min-w-0">
              <p className="font-display text-xl md:text-2xl font-bold text-foreground leading-tight">{carName}</p>
              <p className="text-sm md:text-base text-muted-foreground mt-0.5">
                {years.length ? "EPA" : "Est."} range <strong className="text-foreground">{epaMiles} mi</strong> · {charge}% charge
              </p>
            </div>}
            <p role="status" className="text-base">
              {status === "notfound" && <span className="text-destructive">Couldn't find that place. Try a ZIP code, a city and state, or a street address.</span>}
              {status === "error" && <span className="text-destructive">Couldn't reach the location lookup. Try again.</span>}
              {status === "idle" && place && (
                <span className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2">
                  <MapPin className="w-5 h-5 text-primary" /> <strong className="text-foreground font-semibold text-base md:text-lg">{place.label}</strong>
                </span>
              )}
            </p>
            {modelId && place && !embed && (
              <ShareGate
                url={shareUrl()}
                title={`The ${carName} can go about ${rings.full} miles from ${place.label} on a ${charge}% charge. See how far your EV can go:`}
                summary={`${carName} range from ${place.label}`}
                description="See an EV's driving range drawn on the map. This link reopens the Range Map with the same vehicle, charge and starting place."
                image="/og/range-map.jpg"
                meta={`${carName} · ${rings.full} mi one way · ${charge}% charge · from ${place.label}`}
                formType="range-map-share"
                variant="label"
                label="Share this range"
                stopNav={false}
                className="inline-flex items-center gap-2 rounded-xl gradient-primary px-5 py-3 text-base font-semibold text-white shadow-card transition hover:opacity-90"
              />
            )}
          </div>

          {/* Map with floating range numbers. `isolate` keeps Leaflet's z-index 400+ panes under the dropdowns. */}
          <div className="relative isolate rounded-3xl overflow-hidden border border-border">
            <Suspense fallback={<div className={`${MAP_HEIGHT} grid place-items-center text-sm text-muted-foreground`}>Loading the map...</div>}>
              {/* OSM's low-zoom style is washed out; boost tile color without changing provider. */}
              <RangeCircleMap center={place} rings={mapRings} className={`${MAP_HEIGHT} w-full [&_.leaflet-tile-pane]:[filter:saturate(1.8)_contrast(1.05)]`} />
            </Suspense>

            <ul className="absolute top-3 left-14 right-3 z-[500] flex flex-wrap justify-end gap-2 pointer-events-none">
              {mapRings.map((r) => (
                <li key={r.label} className="rounded-xl bg-card/95 backdrop-blur border border-border shadow-sm px-3 py-2 min-w-[96px]">
                  <p className="text-lg md:text-2xl font-bold font-display text-foreground tabular-nums leading-tight">
                    {r.miles}<span className="text-xs font-semibold text-muted-foreground ml-1">mi</span>
                  </p>
                  <p className="text-[11px] md:text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: r.color }} aria-hidden />
                    {r.label}
                  </p>
                </li>
              ))}
            </ul>

            {(!place || !modelId) && (
              <div className="absolute inset-0 z-[500] grid place-items-center pointer-events-none p-4">
                <p className="rounded-2xl bg-card border border-border px-5 py-3 text-sm text-muted-foreground shadow-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" /> {!modelId ? "Choose your EV to draw your range" : "Enter a location to draw your range"}
                </p>
              </div>
            )}
          </div>

          {place && modelId && (
            <section aria-labelledby="range-cities" className="rounded-3xl border border-border bg-card/70 p-5 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <h2 id="range-cities" className="font-display text-lg font-bold text-foreground">
                    How far you can drive on a single charge in the {carName}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    About {rings.full} miles at {charge}% charge. These cities (25,000+ people) are within reach of {place.label}, measured in a straight line.
                    {deepCold && <> Teal ones are still in range in deep cold.</>}
                  </p>
                </div>
                <Link
                  to={chargerUrl}
                  className="inline-flex items-center justify-center gap-2 self-start shrink-0 rounded-xl gradient-primary px-5 py-3 text-base font-semibold text-white shadow-card transition hover:opacity-90"
                >
                  <PlugZap className="w-5 h-5" aria-hidden /> Find chargers
                </Link>
              </div>
              {cities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No city of 25,000+ people is inside this range.</p>
              ) : (
                <ul className="grid grid-cols-1 gap-2 max-h-[520px] overflow-y-auto pr-1" tabIndex={0} aria-label="Cities in range">
                  {cities.map((c) => (
                    <li key={`${c.name}-${c.state}`} className="flex items-center justify-between gap-3 rounded-xl border !border-primary/25 bg-primary/5 shadow-sm px-3 py-2.5 text-sm">
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: deepCold && c.miles <= rings.winter ? COLORS.winter : COLORS.full }} aria-hidden />
                        <span className="truncate font-medium text-foreground">{c.name}, {c.state}</span>
                      </span>
                      <span className="tabular-nums text-muted-foreground shrink-0">{c.miles} mi</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {pois.length > 0 && (
            <section aria-labelledby="range-pois" className="rounded-3xl border border-border bg-card/70 p-5 md:p-6">
              <h2 id="range-pois" className="font-display text-lg font-bold text-foreground">
                Colorado places you can reach on one charge
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Parks, ski resorts, hikes and attractions within {rings.full} miles of {place?.label}, measured in a straight line.
                {deepCold && <> Teal ones are still in range in deep cold.</>}
              </p>
              <ul className="grid grid-cols-1 gap-2 max-h-[520px] overflow-y-auto pr-1" tabIndex={0} aria-label="Places in range">
                {pois.map((p) => (
                  <li key={p.name} className="flex items-center justify-between gap-3 rounded-xl border !border-primary/25 bg-primary/5 shadow-sm px-3 py-2.5 text-sm">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: deepCold && p.miles <= rings.winter ? COLORS.winter : COLORS.full }} aria-hidden />
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-foreground">{p.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">{p.kind} · {p.town}</span>
                      </span>
                    </span>
                    <span className="tabular-nums text-muted-foreground shrink-0">{p.miles} mi</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="text-xs text-muted-foreground leading-relaxed space-y-2 px-1">
            <p>
              Circles show straight-line distance. Road miles run longer, so treat the edge of a circle as an upper limit.
              Ranges are EPA estimates (fueleconomy.gov); models without EPA data yet show our estimate. Your range will vary with speed, terrain, climate, load and battery age.
              Deep cold assumes a 30% loss, the top of the typical 10–30% range.
            </p>
          </div>
        </div>
      </main>
      {embed && (
        <div className="container px-4 max-w-6xl pb-8 text-center">
          <a href="https://electrifyingtheus.com/range-map" target="_blank" rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary">
            Powered by <span className="font-semibold text-foreground">Electrifying the US</span>
          </a>
        </div>
      )}
      {!embed && <Footer />}
    </div>
  );
};

export default RangeMap;
