import { useEffect, useState } from "react";
import { MapPin, Search, ExternalLink, Plug, Zap, Gauge, Locate } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

// Official DOE / AFDC Alternative Fueling Station Locator (authoritative source).
const AFDC_URL = "https://afdc.energy.gov/fuels/electricity-locations#/find/nearest?fuel=ELEC";

const buildMapSrc = (q: string) => {
  const query = q.trim() ? `EV charging stations near ${q.trim()}` : "EV charging stations near me";
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`;
};

const CONNECTORS = [
  { icon: Plug, title: "Level 2 (240V)", desc: "Everyday charging at home, work, and public lots — ~20–40 miles of range per hour." },
  { icon: Gauge, title: "DC Fast Charging", desc: "Highway and road-trip charging — roughly 10–80% in 20–40 minutes." },
  { icon: Zap, title: "NACS vs CCS", desc: "The U.S. is standardizing on NACS (Tesla-style); CCS remains widely supported. Many stations offer both." },
];

const FindACharger = () => {
  const [zip, setZip] = useState("");
  const [query, setQuery] = useState(""); // the applied search term that drives the map
  const [detected, setDetected] = useState(false);
  const [detecting, setDetecting] = useState(true);

  // Auto-detect the visitor's ZIP from their IP and center the map there.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        if (cancelled) return;
        const postal = String(data?.postal ?? "").replace(/\D/g, "").slice(0, 5);
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
  }, []);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(zip.trim());
    setDetected(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        {/* Header */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-secondary/5 to-transparent" aria-hidden />
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
                Filter by connector type, network, and charging speed using the official U.S. Department of
                Energy AFDC Alternative Fueling Station Locator.
              </p>
            </div>
            <a href={AFDC_URL} target="_blank" rel="noopener noreferrer" className="shrink-0">
              <Button variant="green" className="rounded-xl">
                Open AFDC Locator <ExternalLink className="w-4 h-4" />
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
      <Footer />
    </div>
  );
};

export default FindACharger;
