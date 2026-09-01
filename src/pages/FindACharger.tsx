import { useEffect, useState } from "react";
import { MapPin, Search, ExternalLink, Plug, Zap, Gauge, Locate } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEmbedFrame } from "@/hooks/useEmbedFrame";
import { Button } from "@/components/ui/button";
import ShareGate from "@/components/forms/ShareGate";

// A shared link reopens the page on the same location: /find-a-charger?zip=30301
const initialZipFromUrl = (): string => {
  if (typeof window === "undefined") return "";
  return (new URLSearchParams(window.location.search).get("zip") || "").replace(/\D/g, "").slice(0, 5);
};

/**
 * The search Google Maps runs, for a five-digit US ZIP.
 *
 * ", USA" is not decoration. A bare "30031" is a number, not an address, so
 * Google resolves it against the VIEWER's region — a visitor abroad searching
 * 30031 was shown chargers in their own country, thousands of miles from the
 * ZIP they typed. Naming the country pins it to the ZIP the visitor asked for,
 * whoever is looking.
 *
 * With no ZIP the search stays "near me": that one is meant to follow the
 * viewer, and there is no ZIP to disagree with.
 */
const searchFor = (q: string) =>
  q.trim() ? `EV charging stations near ${q.trim()}, USA` : "EV charging stations near me";

// Direct Google Maps search link for the same result (good for pasting anywhere).
const mapsLink = (q: string) => `https://www.google.com/maps/search/${encodeURIComponent(searchFor(q))}`;

// Official Alternative Fueling Station Locator (authoritative source).
const STATION_LOCATOR_URL = "https://afdc.energy.gov/fuels/electricity-locations#/find/nearest?fuel=ELEC";

// `gl=us` biases the search to the United States and `hl=en` keeps the labels in
// English — the second half of the same fix, so an embed loaded from abroad
// resolves the ZIP the way a US visitor's would.
const buildMapSrc = (q: string) =>
  `https://www.google.com/maps?q=${encodeURIComponent(searchFor(q))}&output=embed&hl=en&gl=us`;

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
  const urlZip = initialZipFromUrl();
  const [zip, setZip] = useState(urlZip);
  const [query, setQuery] = useState(urlZip); // the applied search term that drives the map
  const [detected, setDetected] = useState(false);
  const [detecting, setDetecting] = useState(!urlZip);

  // Auto-detect the visitor's ZIP from their IP and center the map there — unless
  // a ZIP arrived in the URL (a shared link), which always wins.
  useEffect(() => {
    if (urlZip) return;
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
          setZip(postal);
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
    const z = zip.trim();
    setQuery(z);
    setDetected(false);
    // Reflect the specific result in the URL so it can be shared / reopened.
    if (typeof window !== "undefined") {
      const u = new URL(window.location.href);
      if (z) u.searchParams.set("zip", z); else u.searchParams.delete("zip");
      window.history.replaceState({}, "", u.toString());
    }
  };

  // Shareable link + Google Maps deep link for the currently shown location.
  const shareUrl = `/find-a-charger${query ? `?zip=${encodeURIComponent(query)}` : ""}`;
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
            <div className="text-center max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
                <MapPin className="w-3.5 h-3.5" /> Charging Map
              </span>
              <h1 className="text-4xl md:text-6xl font-bold font-display text-foreground mb-4">
                Find a <span className="text-gradient-primary">Charger</span> Near You
              </h1>
              <p className="text-muted-foreground text-lg">
                Locate public EV charging stations across the U.S. We auto-detect your area —
                or search any ZIP code to explore charging nearby.
              </p>
            </div>

            {/* Search */}
            <form onSubmit={onSubmit} className="mt-8 max-w-xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    value={zip}
                    onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
                    inputMode="numeric"
                    maxLength={5}
                    placeholder={detecting ? "Detecting your location…" : "Enter ZIP code"}
                    aria-label="ZIP code"
                    className="w-full rounded-xl border border-border bg-card pl-10 pr-3 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <Button type="submit" variant="hero" size="lg" className="rounded-xl px-6">
                  <Search className="w-4 h-4" /> Search
                </Button>
              </div>
              {detected && zip && (
                <p className="mt-2 text-xs text-secondary flex items-center justify-center gap-1.5">
                  <Locate className="w-3.5 h-3.5" /> Showing chargers near your detected area ({zip}).
                </p>
              )}
            </form>
          </div>
        </section>

        {/* Map */}
        <div className="container px-4 max-w-5xl mt-10">
          {/* Result toolbar — share THIS location's map, or open it in Google Maps. */}
          <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              {query
                ? <>Showing chargers near <span className="font-semibold text-foreground">{query}</span></>
                : "Showing chargers near you"}
            </p>
            <div className="flex items-center gap-2">
              <a href={mapsLink(query)} target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-1.5 rounded-full bg-card border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary/40 hover:text-primary transition">
                <ExternalLink className="w-3.5 h-3.5" /> Open in Google Maps
              </a>
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
          <div className="rounded-3xl overflow-hidden border border-border shadow-elevated bg-muted">
            <iframe
              title="EV charging stations map"
              src={buildMapSrc(query)}
              className="w-full h-[460px] md:h-[560px]"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

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
