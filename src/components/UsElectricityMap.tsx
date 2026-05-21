import { useRef, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
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

// Site-blue choropleth scale: darker = higher electricity price.
const colorFor = (cents: number) =>
  cents >= 20 ? "hsl(214, 100%, 27%)" : cents >= 14 ? "hsl(214, 90%, 45%)" : "hsl(214, 90%, 78%)";

const LEGEND = [
  { label: "20¢/kWh or more", swatch: "hsl(214, 100%, 27%)" },
  { label: "14–20¢/kWh", swatch: "hsl(214, 90%, 45%)" },
  { label: "Under 14¢/kWh", swatch: "hsl(214, 90%, 78%)" },
];

const usAverage = (() => {
  const vals = Object.values(STATE_ENERGY_RATES).map((r) => r.electricityCentsPerKwh);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
})();

interface Props {
  selected: string;
  onSelect: (code: string) => void;
}

const UsElectricityMap = ({ selected, onSelect }: Props) => {
  const [hover, setHover] = useState<{ code: string; x: number; y: number } | null>(null);
  const hoverRate = hover ? STATE_ENERGY_RATES[hover.code] : null;
  const wrapRef = useRef<HTMLDivElement>(null);

  // Mouse position relative to this container (robust against transformed /
  // backdrop-filtered ancestors that would otherwise offset a fixed tooltip).
  const trackHover = (code: string, e: { clientX: number; clientY: number }) => {
    const rect = wrapRef.current?.getBoundingClientRect();
    setHover({ code, x: e.clientX - (rect?.left ?? 0), y: e.clientY - (rect?.top ?? 0) });
  };

  return (
    <div className="relative" ref={wrapRef}>
      {/* National average badge */}
      <div className="absolute -top-2 left-2 z-10 hidden sm:flex flex-col items-center justify-center w-24 h-24 rounded-full gradient-primary text-white shadow-lg text-center">
        <span className="text-[10px] uppercase tracking-wide opacity-90">U.S. avg</span>
        <span className="text-xl font-bold font-display">{usAverage.toFixed(1)}¢</span>
        <span className="text-[10px] opacity-90">per kWh</span>
      </div>

      {/* Legend */}
      <div className="absolute top-0 right-0 z-10 bg-card/90 backdrop-blur rounded-xl border border-border p-3 space-y-1.5 text-xs">
        <div className="font-semibold text-foreground mb-1">Electricity price</div>
        {LEGEND.map((l) => (
          <div key={l.label} className="flex items-center gap-2 text-muted-foreground">
            <span className="w-4 h-3 rounded-sm" style={{ background: l.swatch }} />
            {l.label}
          </div>
        ))}
      </div>

      {/* Map */}
      <ComposableMap projection="geoAlbersUsa" projectionConfig={{ scale: 1000 }} width={900} height={520} style={{ width: "100%", height: "auto" }}>
        <Geographies geography={geoData}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const code = FIPS_TO_POSTAL[geo.id as string];
              const rate = code ? STATE_ENERGY_RATES[code] : undefined;
              const isSelected = code === selected;
              const fill = rate ? colorFor(rate.electricityCentsPerKwh) : "hsl(210, 20%, 90%)";
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={fill}
                  stroke={isSelected ? "hsl(145, 50%, 38%)" : "#ffffff"}
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
          <div>{hoverRate.electricityCentsPerKwh}¢/kWh · {`$${hoverRate.gasPricePerGallon.toFixed(2)}`}/gal gas</div>
          <div className="opacity-70 mt-0.5">Click to compare →</div>
        </div>
      )}
    </div>
  );
};

export default UsElectricityMap;
