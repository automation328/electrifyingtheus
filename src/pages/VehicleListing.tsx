import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, MapPin, Gauge, BatteryCharging, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ShareGate from "@/components/forms/ShareGate";
import { useMarketplace, findListing } from "@/hooks/use-marketplace";
import { readFilters, serverFilters } from "@/lib/marketplace-filters";
import { isSortKey, isProviderSorted, DEFAULT_SORT } from "@/lib/marketplace-sort";
import { MAX_MARKETPLACE_PAGE } from "@/lib/marketplace-types";
import { vehicles } from "@/data/vehicles";
import { consumerIncentivesFor, stateFromZip, STATE_NAMES } from "@/data/incentives";
import { calculate, homeShareFor, DEFAULTS } from "@/lib/ev-cost";
import { NATIONAL_AVG, STATE_ENERGY_RATES, STATIC_GAS_PRICES } from "@/data/state-energy-rates";
import { useGasPrices, medianGasPrice, resolveStateGasPrice } from "@/hooks/use-gas-prices";

/** Incentives listed on the card before the page hands over to the full list. */
const INCENTIVES_SHOWN = 5;

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

  // The card handed over the whole search that found this car. Re-running it
  // with anything missing — the radius, the price filter, the order, the page —
  // returns a different set of listings, and this one is then "unavailable"
  // despite being on screen a second ago.
  const radius = Number(params.get("radius")) || null;
  // Falls back the way the results page does. The default order is left out of
  // the URL, so reading "no sort" as "no sort" would re-run the search in a
  // different order from the one the visitor was looking at.
  const sortParam = params.get("sort");
  const sort = isSortKey(sortParam) ? sortParam : DEFAULT_SORT;
  const page = Math.min(Math.max(Number(params.get("page")) || 1, 1), MAX_MARKETPLACE_PAGE);

  // Read exactly the way the results page reads it, so the re-run search is the
  // same search: hand-picking a few keys here silently dropped the make and
  // model filters when those moved upstream, and a car found under "Nissan"
  // then failed to resolve because the broader search had pushed it off the
  // page. It also changes the cache key, paying for a call the list page had
  // already made.
  const filters = useMemo(() => serverFilters(readFilters(params)), [params]);

  // Going back means going back to the list as it was left: same search, same
  // filters, same order, same page.
  const backSearch = useMemo(() => {
    const p = new URLSearchParams(params);
    p.delete("embed");
    const s = p.toString();
    return s ? `?${s}` : "";
  }, [params]);

  // No by-id endpoint exists upstream, so the detail page reads the listing out
  // of the search the visitor arrived from.
  const { data, isFetching } = useMarketplace(
    query, radius, filters, isProviderSorted(sort) ? sort : undefined, page,
  );
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

  // Where the visitor is shopping, which is what decides the incentives: the
  // ZIP they searched when it is one, and otherwise the state the car sits in.
  const zip = /^\d{5}$/.test(query) ? query : undefined;
  const incentiveState = (zip ? stateFromZip(zip) : null) ?? listing?.state;

  // What the incentives page needs to open on the same programmes: the ZIP when
  // we have one, the state otherwise. Without it that page auto-detects from the
  // visitor's IP, which is a different state from the car whenever someone is
  // shopping out of their own area.
  const incentiveSearch = zip ? `?zip=${zip}` : incentiveState ? `?state=${incentiveState}` : "";

  const incentives = useMemo(
    () => (incentiveState
      ? consumerIncentivesFor(incentiveState, zip, { usedCar: listing?.condition === "used" })
      : []),
    [incentiveState, zip, listing?.condition],
  );

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

              {/* The three facts someone decides on. They were a line of grey
                  10px text under the title, the same weight as the caption below
                  it; at a glance the page looked like it led with the photo and
                  said nothing. Same shape as the running-cost figures, so the
                  two read as one column of answers. */}
              <dl className="mt-5 grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-card">
                <div className="min-w-0 px-4 py-3.5 first:pl-5">
                  <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Gauge className="w-3.5 h-3.5 shrink-0" /> Mileage
                  </dt>
                  <dd className="font-charge text-lg sm:text-2xl leading-tight text-foreground mt-1 tabular-nums">
                    {listing.mileage != null ? listing.mileage.toLocaleString() : "—"}
                  </dd>
                </div>
                <div className="min-w-0 px-4 py-3.5">
                  <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <BatteryCharging className="w-3.5 h-3.5 shrink-0" /> EPA range
                  </dt>
                  <dd className="font-charge text-lg sm:text-2xl leading-tight text-foreground mt-1 tabular-nums">
                    {/* The band, when the year sold more than one battery and the
                        listing does not say which. Printing only the low end reads
                        as this car's rating, and understates most of them. */}
                    {listing.rangeMi == null ? "—"
                      : listing.rangeMaxMi && listing.rangeMaxMi !== listing.rangeMi
                        ? `${listing.rangeMi}–${listing.rangeMaxMi}`
                        : listing.rangeMi}
                    {listing.rangeMi != null && <span className="text-base text-muted-foreground"> mi</span>}
                  </dd>
                </div>
                <div className="min-w-0 px-4 py-3.5">
                  <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 shrink-0" /> Location
                  </dt>
                  {/* A third of a phone's width is not much for "Colorado
                      Springs", so the name wraps and steps down a size rather
                      than being cut off with no way to read the rest. */}
                  <dd className="font-charge text-lg sm:text-2xl leading-tight text-foreground mt-1 break-words">
                    {listing.city || listing.state || "On request"}
                  </dd>
                  {listing.city && listing.state && (
                    <div className="text-xs text-muted-foreground">{listing.state}</div>
                  )}
                </div>
              </dl>

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

              {/* The programmes themselves, not an invitation to go and look
                  them up: the page already knows the state, the ZIP and that
                  this is a used car, which is most of what decides the list. */}
              <section className="mt-5 rounded-2xl border border-border bg-card p-5">
                <h2 className="font-charge text-xl text-foreground mb-1">
                  Incentives{incentiveState ? ` in ${STATE_NAMES[incentiveState] ?? incentiveState}` : ""}
                </h2>
                {incentives.length > 0 ? (
                  <>
                    <p className="text-xs text-muted-foreground">
                      {listing.condition === "used"
                        ? "Open to a private buyer of a used EV"
                        : "Open to a private buyer"}
                      {zip ? ` near ${zip}` : ""}. Amounts are typical maximums — check each
                      programme's own page for the current rules.
                    </p>
                    <ul className="mt-3 divide-y divide-border">
                      {incentives.slice(0, INCENTIVES_SHOWN).map((item) => (
                        <li key={item.name}>
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-baseline justify-between gap-4 py-3"
                          >
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-foreground group-hover:underline">
                                {item.name}
                              </span>
                              <span className="block text-xs text-muted-foreground truncate">
                                {item.jurisdiction}
                                {item.income ? " · income-qualified" : ""}
                              </span>
                            </span>
                            {item.amount && (
                              <span className="font-charge text-lg text-primary whitespace-nowrap shrink-0">
                                {item.amount}
                              </span>
                            )}
                          </a>
                        </li>
                      ))}
                    </ul>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4">
                      <Button asChild variant="outline" className="rounded-xl">
                        <Link to="/rebate-eligibility">Check what you qualify for</Link>
                      </Button>
                      {incentives.length > INCENTIVES_SHOWN && (
                        <Link
                          to={`/rebates-incentives${incentiveSearch}`}
                          className="text-sm font-medium text-primary hover:underline"
                        >
                          All {incentives.length} programmes
                        </Link>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {incentiveState
                        // Georgia ended its purchase credit in 2015, and the federal
                        // credits sunset in 2025 — "none here" is a real answer.
                        ? `We hold no programme a private buyer of this car can claim ${zip ? `near ${zip}` : `in ${STATE_NAMES[incentiveState] ?? incentiveState}`} right now. Utility and city schemes change often, so it is worth checking.`
                        : "Federal, state and utility incentives can cut thousands off an EV purchase, and eligibility depends on the vehicle, your income and where you live."}
                    </p>
                    <Button asChild variant="outline" className="rounded-xl mt-4">
                      <Link to={`/rebates-incentives${incentiveSearch}`}>
                        Search incentives by ZIP
                      </Link>
                    </Button>
                  </>
                )}
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
                  </form>
                )}
              </div>

              {/* Someone shopping for a car is rarely deciding alone, and the
                  next question after "what does it cost to run" is "against
                  what?". Both live in the space beside the enquiry form, which
                  was empty. */}
              <div className="mt-4 rounded-2xl border border-border bg-card divide-y divide-border">
                <Link
                  to={`/electricity-vs-gasoline?${new URLSearchParams({
                    ...(ev ? { ev: ev.id } : {}),
                    ...(listing.state ? { state: listing.state } : {}),
                  })}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/40 transition-colors rounded-t-2xl"
                >
                  Compare it with a petrol car
                  <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </Link>
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <p className="text-sm text-muted-foreground">Send this to someone</p>
                  <ShareGate
                    url={`/marketplace/${encodeURIComponent(listing.id)}${backSearch}`}
                    title={`${title}${listing.price != null ? ` — ${usd(listing.price)}` : ""}`}
                    formType="vehicle-share"
                    summary={listing.price != null ? `${usd(listing.price)} at ${listing.dealerName ?? "a dealer"}` : undefined}
                    description={[
                      listing.trim,
                      listing.mileage != null ? `${listing.mileage.toLocaleString("en-US")} miles` : null,
                      listing.rangeMi != null ? `${listing.rangeMi}${listing.rangeMaxMi && listing.rangeMaxMi !== listing.rangeMi ? `–${listing.rangeMaxMi}` : ""} mi EPA range` : null,
                    ].filter(Boolean).join(" · ")}
                    image={listing.photoUrl}
                    meta={[listing.city, listing.state].filter(Boolean).join(", ")}
                    variant="label"
                    label="Share"
                  />
                </div>
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
