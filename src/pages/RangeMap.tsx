import { lazy, Suspense, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Gauge, Loader2, MapPin, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import type { RangeRing } from "@/components/RangeCircleMap";
import {
  lookupZip, modelsOf, RANGE_MAKES, rangeRings, variantLabel, variantsOf, yearsOf, type ZipPlace,
} from "@/lib/range-map";

const RangeCircleMap = lazy(() => import("@/components/RangeCircleMap"));

const COLORS = { full: "#1f7a4d", winter: "#0e7490" };

const DEFAULT_MAKE = RANGE_MAKES.includes("Chevrolet") ? "Chevrolet" : RANGE_MAKES[0];

const MAP_HEIGHT = "h-[480px] lg:h-[620px]";

type Status = "idle" | "loading" | "notfound" | "error";

const Field = ({ label, className = "", children }: { label: string; className?: string; children: ReactNode }) => (
  <label className={`grid gap-1.5 text-xs font-medium text-muted-foreground min-w-0 ${className}`}>
    {label}
    {children}
  </label>
);

const RangeMap = () => {
  const [make, setMake] = useState(DEFAULT_MAKE);
  const [modelId, setModelId] = useState(() => modelsOf(DEFAULT_MAKE)[0]?.id ?? "");
  const [year, setYear] = useState(() => yearsOf(modelsOf(DEFAULT_MAKE)[0]?.id ?? "")[0] ?? 0);
  // Index 0 is the year's lowest EPA rating: the safe default when planning a trip.
  const [variantIdx, setVariantIdx] = useState(0);
  const [charge, setCharge] = useState(100);
  const [typed, setTyped] = useState("");
  const [place, setPlace] = useState<ZipPlace | null>(null);
  const [status, setStatus] = useState<Status>("idle");

  const models = useMemo(() => modelsOf(make), [make]);
  const years = useMemo(() => yearsOf(modelId), [modelId]);
  const variants = useMemo(() => variantsOf(modelId, year), [modelId, year]);
  const epaMiles = variants[variantIdx]?.[0] ?? variants[0]?.[0] ?? 0;
  const rings = useMemo(() => rangeRings(epaMiles, charge), [epaMiles, charge]);

  const mapRings: RangeRing[] = useMemo(() => [
    { miles: rings.full, color: COLORS.full, label: "One way" },
    { miles: rings.winter, color: COLORS.winter, label: "Deep cold" },
  ], [rings]);

  const pickModel = (id: string) => {
    setModelId(id);
    setYear(yearsOf(id)[0] ?? 0);
    setVariantIdx(0);
  };
  const pickMake = (m: string) => {
    setMake(m);
    pickModel(modelsOf(m)[0]?.id ?? "");
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const zip = typed.trim();
    if (!/^\d{5}$/.test(zip)) { setStatus("notfound"); return; }
    setStatus("loading");
    try {
      const hit = await lookupZip(zip);
      setPlace(hit);
      setStatus(hit ? "idle" : "notfound");
    } catch {
      setStatus("error");
    }
  };

  const modelName = models.find((m) => m.id === modelId)?.model ?? "";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pb-16 pt-28">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-secondary/5 to-transparent" aria-hidden />
          <div className="container relative z-10 px-4 max-w-6xl">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-3">
              <Gauge className="w-3.5 h-3.5" /> Range Map
            </span>
            <h1 className="text-3xl md:text-5xl font-bold font-display text-foreground mb-2">
              How Far Can Your <span className="text-gradient-primary">EV</span> Go?
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Pick your vehicle and a starting ZIP code to see your driving range as a radius on the map.
            </p>
          </div>
        </section>

        <div className="container px-4 max-w-6xl mt-8 grid gap-4">
          {/* Control bar */}
          <form
            onSubmit={onSubmit}
            className="rounded-3xl border border-border bg-card p-4 md:p-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-12 items-end"
          >
            <Field label="Make" className="lg:col-span-2">
              <Select value={make} onValueChange={pickMake}>
                <SelectTrigger aria-label="Make"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RANGE_MAKES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Model" className="lg:col-span-3">
              <Select value={modelId} onValueChange={pickModel}>
                <SelectTrigger aria-label="Model"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {models.map((m) => <SelectItem key={m.id} value={m.id}>{m.model}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Year" className="lg:col-span-2">
              <Select value={String(year)} onValueChange={(v) => { setYear(Number(v)); setVariantIdx(0); }}>
                <SelectTrigger aria-label="Year"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid gap-1.5 lg:col-span-2">
              <div className="flex justify-between text-xs font-medium text-muted-foreground">
                <span id="charge-label">Battery charge</span>
                <span className="font-semibold text-foreground tabular-nums">{charge}%</span>
              </div>
              <Slider
                value={[charge]} min={10} max={100} step={5}
                onValueChange={([v]) => setCharge(v)}
                aria-labelledby="charge-label"
                className="h-10"
              />
            </div>
            <div className="grid gap-1.5 sm:col-span-2 lg:col-span-3">
              <span className="text-xs font-medium text-muted-foreground">Starting ZIP code</span>
              <div className="flex gap-2">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    value={typed}
                    onChange={(e) => setTyped(e.target.value.replace(/\D/g, "").slice(0, 5))}
                    inputMode="numeric"
                    autoComplete="postal-code"
                    placeholder="e.g. 94103"
                    aria-label="ZIP code"
                    className="w-full h-10 rounded-md border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <Button type="submit" variant="hero" className="h-10 rounded-md px-4" disabled={status === "loading"}>
                  {status === "loading" ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                  Go
                </Button>
              </div>
            </div>

            {variants.length > 1 && (
              <Field label={`Version (${variants.length} EPA ratings)`} className="sm:col-span-2 lg:col-span-7">
                <Select value={String(variantIdx)} onValueChange={(v) => setVariantIdx(Number(v))}>
                  <SelectTrigger aria-label="Version"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {variants.map((v, i) => <SelectItem key={i} value={String(i)}>{variantLabel(v)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            )}
          </form>

          {/* Summary line */}
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-1">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground font-display text-base">{year} {make} {modelName}</strong>
              {" · "}EPA range <strong className="text-foreground">{epaMiles} mi</strong> · {charge}% charge
            </p>
            <p role="status" className="text-sm">
              {status === "notfound" && <span className="text-destructive">Enter a valid 5-digit U.S. ZIP code.</span>}
              {status === "error" && <span className="text-destructive">Couldn't reach the ZIP lookup. Try again.</span>}
              {status === "idle" && place && (
                <span className="text-muted-foreground inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary" /> <strong className="text-foreground">{place.label}</strong>
                </span>
              )}
            </p>
          </div>

          {/* Map with floating range numbers */}
          <div className="relative rounded-3xl overflow-hidden border border-border">
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

            {!place && (
              <div className="absolute inset-0 z-[500] grid place-items-center pointer-events-none p-4">
                <p className="rounded-2xl bg-card border border-border px-5 py-3 text-sm text-muted-foreground shadow-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" /> Enter a ZIP code to draw your range
                </p>
              </div>
            )}
          </div>

          <div className="text-xs text-muted-foreground leading-relaxed space-y-2 px-1">
            <p>
              Circles show straight-line distance. Road miles run longer, so treat the edge of a circle as an upper limit.
              Ranges are EPA estimates (fueleconomy.gov). Your range will vary with speed, terrain, climate, load and battery age.
              Deep cold assumes a 30% loss, the top of the typical 10–30% range.
            </p>
            <p>
              <Link to="/evs-in-winter" className="text-primary font-semibold hover:underline">How EVs handle winter</Link>
              {" · "}
              <Link to="/find-a-charger" className="text-primary font-semibold hover:underline">Find chargers along the way</Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RangeMap;
