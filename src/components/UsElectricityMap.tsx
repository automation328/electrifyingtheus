import { useRef, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { Zap, Fuel } from "lucide-react";
import { STATE_ENERGY_RATES } from "@/data/state-energy-rates";
import geoData from "@/data/us-states-10m.json";

// US Census FIPS (2-digit) → USPS postal code, matching our energy-rates keys.
const FIPS_TO_POSTAL: Record<string, string> = {
  "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO", "09": "CT",
  "10": "DE", "11": "DC", "12": "FL", "13": "GA", "15": "HI", "16": "ID", "17": "IL",
  "18": "IN", "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME", "24": "MD",
  "25": "MA", "26": "MI", "27": "MN", "28": "MS", "29": "MO", "30": "MT", "31": "NE",
  "32": "NV", "33": "NH", "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
  "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD",
  "47": "TN", "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA", "54": "WV",
  "55": "WI", "56": "WY",
};

// Tiny northeastern states + DC are hard to click on an Albers map — surface them as chips.
const SMALL_STATES = ["VT", "NH", "MA", "RI", "CT", "NJ", "DE", "MD", "DC"];

type Metric = "electricity" | "gas";

// Blue choropleth for electricity, orange for gas. Darker = pricier.
const colorForElec = (cents: number) =>
  cents >= 20 ? "hsl(214, 100%, 27%)" : cents >= 14 ? "hsl(214, 90%, 45%)" : "hsl(214, 90%, 78%)";
const colorForGas = (usd: number) =>
  usd >= 4.75 ? "hsl(18, 88%, 38%)" : usd >= 4.1 ? "hsl(28, 95%, 55%)" : "hsl(33, 100%, 80%)";

const ELEC_LEGEND = [
  { label: "20¢/kWh or more", swatch: "hsl(214, 100%, 27%)" },
  { label: "14–20¢/kWh", swatch: "hsl(214, 90%, 45%)" },
  { label: "Under 14¢/kWh", swatch: "hsl(214, 90%, 78%)" },
];
const GAS_LEGEND = [
  { label: "$4.75/gal or more", swatch: "hsl(18, 88%, 38%)" },
  { label: "$4.10–4.75/gal", swatch: "hsl(28, 95%, 55%)" },
  { label: "Under $4.10/gal", swatch: "hsl(33, 100%, 80%)" },
];

const elecAverage = (() => {
  const vals = Object.values(STATE_ENERGY_RATES).map((r) => r.electricityCentsPerKwh);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
})();

function timeAgo(iso: string): string {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3.6e6);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface Props {
  selected: string;
  onSelect: (code: string) => void;
  /** Live regular-gas prices (USPS code → $/gal). Falls back to static values. */
  gasPrices?: Record<string, number>;
  gasUpdatedAt?: string | null;
}

const UsElectricityMap = ({ selected, onSelect, gasPrices, gasUpdatedAt }: Props) => {
  const [metric, setMetric] = useState<Metric>("electricity");
  const [hover, setHover] = useState<{ code: string; x: number; y: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const isGas = metric === "gas";
  const hasLiveGas = !!gasPrices && Object.keys(gasPrices).length > 0;

  // Resolve a state's gas price: live first, static fallback.
  const gasFor = (code: string): number | undefined =>
    gasPrices?.[code] ?? STATE_ENERGY_RATES[code]?.gasPricePerGallon;

  const gasAverage = (() => {
    const vals = Object.keys(STATE_ENERGY_RATES)
      .map((c) => gasFor(c))
      .filter((v): v is number => typeof v === "number");
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  })();

  const fillFor = (code: string): string => {
    const rate = STATE_ENERGY_RATES[code];
    if (!rate) return "hsl(210, 20%, 90%)";
    return isGas ? colorForGas(gasFor(code) ?? rate.gasPricePerGallon) : colorForElec(rate.electricityCentsPerKwh);
  };

  // Mouse position relative to this container (robust against transformed ancestors).
  const trackHover = (code: string, e: { clientX: number; clientY: number }) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    setHover({ code, x: e.clientX - (rect?.left ?? 0), y: e.clientY - (rect?.top ?? 0) });
  };

  const hoverRate = hover ? STATE_ENERGY_RATES[hover.code] : null;
  const legend = isGas ? GAS_LEGEND : ELEC_LEGEND;
  const accent = isGas ? "hsl(145, 50%, 38%)" : "hsl(145, 50%, 38%)";

  return (
    <div className="relative" ref={wrapRef}>
      {/* Metric toggle */}
      <div className="flex items-center justify-center gap-1 mb-3">
        <div className="inline-flex rounded-xl border border-border bg-card p-1">
          <button
            type="button"
            onClick={() => setMetric("electricity")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              !isGas ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Zap className="w-4 h-4" /> Electricity
          </button>
          <button
            type="button"
            onClick={() => setMetric("gas")}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isGas ? "text-white" : "text-muted-foreground hover:text-foreground"
            }`}
            style={isGas ? { background: "hsl(24, 95%, 53%)" } : undefined}
          >
            <Fuel className="w-4 h-4" /> Gas price
          </button>
        </div>
      </div>

      {/* National average badge */}
      <div
        className="absolute top-12 left-2 z-10 hidden sm:flex flex-col items-center justify-center w-24 h-24 rounded-full text-white shadow-lg text-center"
        style={{ background: isGas ? "linear-gradient(135deg, hsl(24 95% 53%), hsl(16 88% 48%))" : "var(--gradient-hero)" }}
      >
        <span className="text-[10px] uppercase tracking-wide opacity-90">U.S. avg</span>
        {isGas ? (
          <>
            <span className="text-lg font-bold font-display">${gasAverage.toFixed(2)}</span>
            <span className="text-[10px] opacity-90">per gallon</span>
          </>
        ) : (
          <>
            <span className="text-xl font-bold font-display">{elecAverage.toFixed(1)}¢</span>
            <span className="text-[10px] opacity-90">per kWh</span>
          </>
        )}
      </div>

      {/* Legend */}
      <div className="absolute top-12 right-0 z-10 bg-card/90 backdrop-blur rounded-xl border border-border p-3 space-y-1.5 text-xs">
        <div className="font-semibold text-foreground mb-1">{isGas ? "Gas price (regular)" : "Electricity price"}</div>
        {legend.map((l) => (
          <div key={l.label} className="flex items-center gap-2 text-muted-foreground">
            <span className="w-4 h-3 rounded-sm" style={{ background: l.swatch }} />
            {l.label}
          </div>
        ))}
        {isGas && (
          <div className="pt-1 text-[10px] text-muted-foreground border-t border-border/60 mt-1">
            {hasLiveGas ? (
              <span className="inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                Live · AAA{gasUpdatedAt ? ` · updated ${timeAgo(gasUpdatedAt)}` : ""}
              </span>
            ) : (
              "Estimated averages"
            )}
          </div>
        )}
      </div>

      {/* Map */}
      <ComposableMap projection="geoAlbersUsa" projectionConfig={{ scale: 1000 }} width={900} height={520} style={{ width: "100%", height: "auto" }}>
        <Geographies geography={geoData}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const code = FIPS_TO_POSTAL[geo.id as string];
              const rate = code ? STATE_ENERGY_RATES[code] : undefined;
              const isSelected = code === selected;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={code ? fillFor(code) : "hsl(210, 20%, 90%)"}
                  stroke={isSelected ? accent : "#ffffff"}
                  strokeWidth={isSelected ? 3 : 0.6}
                  style={{
                    default: { outline: "none", cursor: rate ? "pointer" : "default" },
                    hover: { outline: "none", fillOpacity: rate ? 0.82 : 1, cursor: rate ? "pointer" : "default" },
                    pressed: { outline: "none" },
                  }}
                  onMouseMove={(e) => code && rate && trackHover(code, e)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => code && rate && onSelect(code)}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Small-state chips */}
      <div className="mt-3 flex flex-wrap gap-1.5 justify-center">
        {SMALL_STATES.map((code) => (
          <button
            key={code}
            onClick={() => onSelect(code)}
            className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
              selected === code
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:border-primary/40"
            }`}
            title={STATE_ENERGY_RATES[code]?.name}
          >
            {code}
          </button>
        ))}
      </div>

      {/* Hover tooltip — anchored next to the cursor, inside this container */}
      {hover && hoverRate && (
        <div
          className="absolute z-50 pointer-events-none rounded-lg bg-foreground text-background px-3 py-2 text-xs shadow-xl whitespace-nowrap -translate-x-1/2 -translate-y-full"
          style={{ left: hover.x, top: hover.y - 10 }}
        >
          <div className="font-semibold">{hoverRate.name}</div>
          <div>
            {hoverRate.electricityCentsPerKwh}¢/kWh · ${(gasFor(hover.code) ?? hoverRate.gasPricePerGallon).toFixed(2)}/gal
            {hasLiveGas && gasPrices?.[hover.code] != null ? " (live)" : ""}
          </div>
          <div className="opacity-70 mt-0.5">Click to compare →</div>
        </div>
      )}
    </div>
  );
};

export default UsElectricityMap;
