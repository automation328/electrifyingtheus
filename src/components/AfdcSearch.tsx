import { useEffect, useMemo, useState } from "react";
import { Search, ExternalLink, Loader2, AlertCircle, FileSearch } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

// Calls our own serverless proxy (api/incentives.ts), which holds the NREL key
// server-side and CDN-caches results to stay under NREL's rate limit.
const ENDPOINT = "/api/incentives";

interface Law {
  id: number;
  state: string;
  title: string;
  plaintext: string;
  type: string;
  technology_titles?: string[];
}

const JURISDICTIONS: { value: string; label: string }[] = [
  { value: "US", label: "Federal" },
  { value: "AL", label: "Alabama" }, { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" }, { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" }, { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" }, { value: "DE", label: "Delaware" },
  { value: "DC", label: "District of Columbia" }, { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" }, { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" }, { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" }, { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" }, { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" }, { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" }, { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" }, { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" }, { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" }, { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" }, { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" }, { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" }, { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" }, { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" }, { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" }, { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" }, { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" }, { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" }, { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" }, { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" }, { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
];

const TECHNOLOGIES: { value: string; label: string }[] = [
  { value: "ELEC", label: "Electricity / EVs" },
  { value: "PHEV", label: "Plug-in Hybrids" },
  { value: "HEV", label: "Hybrids" },
  { value: "HY", label: "Hydrogen / Fuel Cell" },
  { value: "BIOD", label: "Biodiesel" },
  { value: "ETH", label: "Ethanol" },
  { value: "NG", label: "Natural Gas" },
  { value: "LPG", label: "Propane (LPG)" },
];

const truncate = (s: string, n = 240) =>
  s.length > n ? `${s.slice(0, n).trimEnd()}…` : s;

const AfdcSearch = () => {
  const [jurisdiction, setJurisdiction] = useState("US");
  const [technology, setTechnology] = useState("ELEC");
  const [type, setType] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [laws, setLaws] = useState<Law[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ jurisdiction, technology });
        const res = await fetch(`${ENDPOINT}?${params}`, { signal: controller.signal });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
        setLaws(Array.isArray(data.result) ? data.result : []);
        setType("all");
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          setError("Couldn't load incentives right now. Try again in a moment.");
          setLaws([]);
        }
      } finally {
        setLoading(false);
      }
    };
    run();
    return () => controller.abort();
  }, [jurisdiction, technology]);

  const types = useMemo(
    () => Array.from(new Set(laws.map((l) => l.type).filter(Boolean))).sort(),
    [laws],
  );

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return laws.filter((l) => {
      if (type !== "all" && l.type !== type) return false;
      if (kw && !(`${l.title} ${l.plaintext}`.toLowerCase().includes(kw))) return false;
      return true;
    });
  }, [laws, keyword, type]);

  const shown = filtered.slice(0, 40);

  return (
    <div className="container px-4 max-w-5xl mt-16">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-3">
          <FileSearch className="w-4 h-4" /> Laws &amp; Incentives Database
        </span>
        <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-3">
          Search every <span className="text-gradient-primary">law &amp; incentive</span>
        </h2>
        <p className="text-muted-foreground">
          Filter the full U.S. Department of Energy database by jurisdiction, technology, and type.
        </p>
      </div>

      {/* Controls */}
      <div className="glass-card rounded-3xl p-5 md:p-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Keyword (e.g. rebate)"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="pl-9 h-11"
              aria-label="Keyword"
            />
          </div>

          <Select value={jurisdiction} onValueChange={setJurisdiction}>
            <SelectTrigger className="h-11" aria-label="Jurisdiction"><SelectValue /></SelectTrigger>
            <SelectContent className="max-h-72">
              {JURISDICTIONS.map((j) => (
                <SelectItem key={j.value} value={j.value}>{j.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={technology} onValueChange={setTechnology}>
            <SelectTrigger className="h-11" aria-label="Technology"><SelectValue /></SelectTrigger>
            <SelectContent>
              {TECHNOLOGIES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-11" aria-label="Type"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {types.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      <div className="mt-6">
        {loading ? (
          <div className="flex items-center justify-center gap-2 text-muted-foreground py-12">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading incentives…
          </div>
        ) : error ? (
          <div className="flex items-center justify-center gap-2 text-destructive py-12">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            No matching laws or incentives. Try a different filter or keyword.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Showing {shown.length} of {filtered.length} result{filtered.length === 1 ? "" : "s"}
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {shown.map((l) => (
                <a
                  key={l.id}
                  href={`https://afdc.energy.gov/laws/${l.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block rounded-2xl border border-border bg-card shadow-card p-5 hover:shadow-xl hover:-translate-y-0.5 hover:border-primary/40 transition-all"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {l.type}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {l.state}
                    </span>
                  </div>
                  <h3 className="font-bold font-display text-foreground leading-snug mb-1.5 group-hover:text-primary transition-colors">
                    {l.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{truncate(l.plaintext)}</p>
                  <span className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-primary group-hover:gap-2.5 transition-all">
                    View on AFDC <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </a>
              ))}
            </div>
          </>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-4 text-center">
        Data: U.S. DOE Alternative Fuels Data Center. Confirm current eligibility and funding on each program page.
      </p>
    </div>
  );
};

export default AfdcSearch;
