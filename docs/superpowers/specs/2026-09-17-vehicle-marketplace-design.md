# Vehicle Marketplace — Design

**Date:** 2026-09-17
**Status:** Approved for implementation (build only; deployment gated on explicit sign-off)

## Purpose

Let a visitor search for electrified vehicles currently for sale near them, and see
what that specific car would cost them to own versus petrol — the thing a generic
car marketplace cannot tell them.

## Decisions

| Decision | Choice | Why |
| --- | --- | --- |
| Listing source | Third-party inventory API, proxied | Real inventory on day one; no cold-start problem |
| Provider | Auto.dev, behind an interface | Native `zip` + `distance`, free tier (1,000 calls/month), simple key auth |
| Scope | Battery-electric and plug-in hybrid only | Matches the site's purpose; enables range/kWh/incentive context per listing |
| Conversion | ETUS detail page, then lead to GoHighLevel | Keeps the visitor here and reuses the existing CRM path |

## The constraint that shapes this

Auto.dev's Listings API has **no fuel-type filter**. `fuelType` exists in their VIN
Decode and Specifications products, not in listings search.

So the query cannot be "electric vehicles near me". It has to be "these specific
models, near me". That works because the site already owns a curated EV catalog
(`src/data/vehicles.ts`, and `site_vehicles` in Supabase), and Auto.dev accepts
comma-separated values as a logical OR — so one search is one upstream request,
not one per model. That is what keeps ordinary usage inside the free tier.

A consequence: matching listing text onto catalog entries is fuzzy, and anything
that does not match a known electrified model is **dropped, not shown**. Missing a
listing is acceptable. Advertising a petrol car on ETUS is not.

## Architecture

```
/marketplace  ──►  use-marketplace  ──►  GET /api/marketplace?q=&radius=&make=&…
                                              │
                                              ├─ resolveQuery()      [reuse api/_geocode.ts]
                                              ├─ checkRateLimit()    [reuse api/_rate-limit.ts]
                                              └─ MarketplaceProvider
                                                     └─ Auto.dev  ──► api.auto.dev/listings
                                                            │
                                                     normalize + verify against EV catalog
                                                            │
                                                     rank by true distance
```

### Units

| Unit | Responsibility | Depends on |
| --- | --- | --- |
| `src/lib/ev-catalog-match.ts` | Map messy listing make/model text onto a catalog EV. Pure. | vehicles catalog |
| `src/lib/marketplace-types.ts` | The `VehicleListing` shape shared by server and client. | — |
| `api/_marketplace-provider.ts` | Provider interface + Auto.dev implementation + normalisation. | fetch |
| `api/marketplace.ts` | HTTP: validate, geocode, rate-limit, call provider, filter, rank. | the three above |
| `src/hooks/use-marketplace.ts` | react-query wrapper. | — |
| `src/pages/Marketplace.tsx` | Search and results. | hook |
| `src/pages/VehicleListing.tsx` | Detail, cost-vs-petrol, incentives, lead form. | hook, ev-cost, incentives |

Each is independently testable; the provider is isolated behind an interface
because it is the part most likely to be replaced (MarketCheck filters on fuel
type natively and is the obvious upgrade if volume justifies its pricing).

### Unconfigured behaviour

With no `MARKETPLACE_API_KEY`, the endpoint returns `{ listings: [], configured: false }`
and the page renders an honest empty state. This mirrors `/api/jobs` with
`JOB_BOARDS` unset. It means the whole feature can be built, tested and reviewed
before anyone buys a key.

### Reuse

`resolveQuery` (ZIP/city/state/address → lat/lon/radius), `checkRateLimit`,
`calculate()` from `ev-cost.ts`, the incentives data, `api/lead.ts` → GoHighLevel,
and the existing page layout and card components.

## Testing

Test-driven. Pure units first — catalog matching, normalisation, distance ranking,
upstream query construction — then the endpoint against a mocked provider. No test
performs a live upstream call.

## Out of scope

User accounts, saved searches, price alerts, financing, trade-in valuation, photo
hosting, and a dealer-facing portal. Each is a separate feature; none is needed to
answer "what electrified cars are for sale near me".

## Known limitations

- Free tier caps results at 20 per page, which is tight for a radius search.
- Auto.dev's `distance` is ZIP-anchored, so city/state/address searches geocode to a
  representative ZIP. True distance is recomputed locally for ranking to compensate.
- Catalog matching will miss models absent from the ETUS catalog until they are added.
