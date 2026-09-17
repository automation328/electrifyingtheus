import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, MapPin, Gauge, BatteryCharging, ExternalLink, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMarketplace, findListing } from "@/hooks/use-marketplace";
import { isSortKey } from "@/lib/marketplace-sort";
import { vehicles } from "@/data/vehicles";
import { calculate, homeShareFor, DEFAULTS } from "@/lib/ev-cost";
import { NATIONAL_AVG, STATE_ENERGY_RATES, STATIC_GAS_PRICES } from "@/data/state-energy-rates";
import { useGasPrices, medianGasPrice, resolveStateGasPrice } from "@/hooks/use-gas-prices";

const usd = (n?: number, frac = 0) =>
  n == null ? "—"
    : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: frac, minimumFractionDigits: frac }).format(n);

/** A representative petrol car to price the comparison against. Uses the same
 *  class as the EV so the number means something — comparing an electric SUV to
 *  a subcompact saloon would flatter the EV for the wrong reason. */
function petrolCounterpart(catalogId: string) {
  const ev = vehicles.find((v) => v.id === catalogId);
  const gas = vehicles.filter((v) => v.type === "gas");
  if (!ev) return gas[0];
  return gas.find((g) => g.bodyStyle === ev.bodyStyle) ?? gas.find((g) => g.category === ev.category) ?? gas[0];
}

const VehicleListing = () => {
  const { id = "" } = useParams();
  const [params] = useSearchParams();
  const query = (params.get("q") || "").trim();

  // Going back means going back to the list as it was left — same search, same
  // order. The sort only travels through the URL, so it has to be handed on.
  const backSearch = useMemo(() => {
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    const sort = params.get("sort");
    if (isSortKey(sort)) p.set("sort", sort);
    const s = p.toString();
    return s ? `?${s}` : "";
  }, [params, query]);

  // No by-id endpoint exists upstream, so the detail page reads the listing out
  // of the search the visitor arrived from.
  const { data, isFetching } = useMarketplace(query);
  const listing = findListing(data, decodeURIComponent(id));

  const { data: gasData } = useGasPrices();
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [formError, setFormError] = useState<string | null>(null);

  const ev = listing ? vehicles.find((v) => v.id === listing.catalogId) : undefined;

  const savings = useMemo(() => {
    if (!listing || !ev) return null;
    const gas = petrolCounterpart(listing.catalogId);
    if (!gas?.mpg) return null;

    const gasPrice = listing.state
      ? resolveStateGasPrice(listing.state, gasData?.prices)
      : medianGasPrice(gasData?.prices) ?? medianGasPrice(STATIC_GAS_PRICES) ?? NATIONAL_AVG.gasPricePerGallon;
    const kwh = (listing.state && STATE_ENERGY_RATES[listing.state]?.electricityCentsPerKwh
      ? STATE_ENERGY_RATES[listing.state].electricityCentsPerKwh
      : NATIONAL_AVG.electricityCentsPerKwh) / 100;

    try {
      return calculate({
        annualMiles: 12000, horizonYears: 5,
        gasPricePerGallon: gasPrice,
        homeKwhPrice: kwh, publicKwhPrice: DEFAULTS.publicKwhPrice,
        homeChargingShare: homeShareFor(true), chargingLoss: DEFAULTS.chargingLoss,
        gas: { mpgCombined: gas.mpg }, ev: { mpgeCombined: ev.mpge, kwhPer100mi: ev.kwhPer100mi },
        federalCredit: 0, stateRebate: 0, utilityRebate: 0,
      });
    } catch {
      return null; // incomplete catalog data — show the listing without the estimate
    }
  }, [listing, ev, gasData]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!listing) return;
    setSending(true);
    setFormError(null);
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formType: "marketplace-enquiry",
          ...form,
          city: listing.city ?? "",
          subject: `${listing.year} ${listing.make} ${listing.model}`,
          message: [
            `Vehicle: ${listing.year} ${listing.make} ${listing.model}${listing.trim ? ` ${listing.trim}` : ""}`,
            listing.price != null ? `Asking: ${usd(listing.price)}` : null,
            listing.dealerName ? `Dealer: ${listing.dealerName}` : null,
            listing.vin ? `VIN: ${listing.vin}` : null,
            listing.listingUrl ? `Listing: ${listing.listingUrl}` : null,
          ].filter(Boolean).join("\n"),
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error || "Could not send that just now.");
      setSent(true);
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  if (isFetching && !listing) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-28 grid place-items-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 pt-28 pb-16">
          <div className="container px-4 max-w-2xl text-center">
            <h1 className="font-charge text-3xl text-foreground mb-3">Listing not available</h1>
            <p className="text-muted-foreground mb-6">
              Vehicle listings change constantly — this one may already be sold. Search again to see what's available now.
            </p>
            <Button asChild className="rounded-xl">
              <Link to={`/marketplace${backSearch}`}>Back to the marketplace</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const title = `${listing.year} ${listing.make} ${listing.model}`;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container px-4 max-w-5xl">
          <Link
            to={`/marketplace${backSearch}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="w-4 h-4" /> Back to results
          </Link>

          <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <div className="aspect-[16/10] rounded-2xl overflow-hidden bg-muted mb-5">
                {listing.photoUrl
                  ? <img src={listing.photoUrl} alt={title} className="w-full h-full object-cover" />
                  : <div className="w-full h-full grid place-items-center"><BatteryCharging className="w-12 h-12 opacity-30" /></div>}
              </div>

              <h1 className="font-charge text-3xl md:text-4xl text-foreground">{title}</h1>
              {listing.trim && <p className="text-muted-foreground mt-1">{listing.trim}</p>}

              <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 text-sm text-muted-foreground">
                {listing.mileage != null && (
                  <span className="inline-flex items-center gap-1.5"><Gauge className="w-4 h-4" />{listing.mileage.toLocaleString()} miles</span>
                )}
                {listing.rangeMi != null && (
                  <span className="inline-flex items-center gap-1.5"><BatteryCharging className="w-4 h-4" />{listing.rangeMi} mi EPA range</span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {[listing.city, listing.state].filter(Boolean).join(", ") || "Location on request"}
                </span>
              </div>

              {savings && (
                <section className="mt-8 rounded-2xl border border-border bg-card p-5">
                  <h2 className="font-charge text-xl text-foreground mb-1">What it costs to run</h2>
                  <p className="text-xs text-muted-foreground mb-4">
                    Versus a comparable petrol car, 12,000 miles a year, mostly home charging
                    {listing.state ? `, at ${listing.state} energy prices` : ""}.
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="font-charge text-2xl text-foreground">{usd(Math.round(savings.annualSavings))}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">saved per year on fuel</div>
                    </div>
                    <div>
                      <div className="font-charge text-2xl text-foreground">{usd(Math.round(savings.annualSavings * 5))}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">over five years</div>
                    </div>
                    <div>
                      <div className="font-charge text-2xl text-foreground">${savings.evCostPerMile.toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">per mile to charge</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-4">
                    An estimate for comparison, not a quote. Your costs depend on how and where you drive and charge.
                  </p>
                </section>
              )}

              <section className="mt-5 rounded-2xl border border-border bg-card p-5">
                <h2 className="font-charge text-xl text-foreground mb-1">Incentives</h2>
                <p className="text-sm text-muted-foreground">
                  Federal, state and utility incentives can cut thousands off an EV purchase, and
                  eligibility depends on the vehicle, your income and where you live.
                </p>
                <Button asChild variant="outline" className="rounded-xl mt-4">
                  <Link to="/rebate-eligibility">Check what this vehicle qualifies for</Link>
                </Button>
              </section>
            </div>

            <aside className="lg:sticky lg:top-28 self-start w-full">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                <div className="font-charge text-3xl text-foreground">
                  {listing.price != null ? usd(listing.price) : "Call for price"}
                </div>
                {listing.dealerName && (
                  <p className="text-sm text-muted-foreground mt-1">at {listing.dealerName}</p>
                )}

                {sent ? (
                  <p className="mt-5 rounded-xl bg-secondary/10 p-4 text-sm text-foreground">
                    Thanks — we've passed your details along. Someone will be in touch about this vehicle.
                  </p>
                ) : (
                  <form onSubmit={submit} className="mt-5 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <Input required placeholder="First name" aria-label="First name"
                        value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                      <Input required placeholder="Last name" aria-label="Last name"
                        value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                    </div>
                    <Input required type="email" placeholder="Email" aria-label="Email"
                      value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                    <Input type="tel" placeholder="Phone (optional)" aria-label="Phone"
                      value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                    {formError && <p className="text-sm text-destructive">{formError}</p>}
                    <Button type="submit" className="w-full rounded-xl h-11" disabled={sending}>
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enquire about this vehicle"}
                    </Button>
                    <p className="text-[11px] text-muted-foreground">
                      We'll share your details with the seller so they can respond.
                    </p>
                  </form>
                )}

                {listing.listingUrl && (
                  <a
                    href={listing.listingUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
                  >
                    View the original listing <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default VehicleListing;
