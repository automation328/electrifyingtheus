# Find a Charger — how it is built

Reference notes for `/find-a-charger`, written so the same shape can be reused for
another tool page on this site. The tool answers one question — "where can I plug
in near here, and is it a fast charger or a wall-speed Level 2?" — and everything
in it exists to answer that.

Read this alongside `docs/INFRA.md` (deployment, env vars) and
`docs/security-headers.md` (CSP status).

## 1. Shape of the thing

```
visitor types "atlanta, ga"
        |
  src/pages/FindACharger.tsx        state, form, filter pills, result list
        |  fetchStations()
  src/lib/stations.ts               query-string builder + domain helpers
        |  GET /api/stations?q=atlanta%2C+ga&level=dc_fast
  api/stations.ts                   serverless proxy (Vercel function)
        |  resolveQuery("atlanta, ga")
  api/_geocode.ts                   text -> { lat, lon, label, kind, radius }
        |  GET developer.nlr.gov/.../nearest.json
  AFDC / NREL Alternative Fuel Stations API
        |
  trimmed JSON  ->  react-query  ->  ChargerMap (Leaflet) + station cards
```

Five layers, each with one job. The browser never talks to the upstream API and
never holds an API key.

## 2. Files

| File | Job |
| --- | --- |
| `src/App.tsx:22,110` | Route registration for `/find-a-charger` |
| `src/pages/FindACharger.tsx` | The page: state, search form, filter pills, result list, share, embed |
| `src/components/ChargerMap.tsx` | Lazy-loaded Leaflet map |
| `src/lib/stations.ts` | Station type, kind/filter/label helpers, query-string builder, `fetchStations` |
| `src/lib/stations.test.ts` | Unit tests for the pure helpers |
| `api/stations.ts` | Serverless proxy to AFDC/NREL, caching, retries, field trimming |
| `api/_geocode.ts` | Free-text search to coordinates plus a radius |
| `api/_geocode.test.ts` | Unit tests for the pure geocoding helpers |
| `api/geo.ts` | IP geolocation from Vercel edge headers (shared by several tools) |
| `src/hooks/useEmbedFrame.ts` | Embed mode: `.embed` class, host font, iframe auto-resize |
| `middleware.ts` | `EMBED_TOOL_PATHS` allowlist — lets `?embed=1` skip the password gate |
| `public/embed.js` | Partner-facing loader script; carries its own tool allowlist |
| `sitemap-urls.ts:54` | Sitemap entry |
| `src/lib/site-links.ts:16`, `src/data/footer.ts:47`, `src/components/Navbar.tsx` | The three link registries |

## 3. The page

`src/pages/FindACharger.tsx` is a client-rendered React page. No CMS row backs it,
so it renders no `SeoHead` and inherits the site default card.

### State

```ts
const [typed, setTyped]       = useState(urlQuery);   // every keystroke
const [query, setQuery]       = useState(urlQuery);   // the applied search
const [level, setLevel]       = useState<LevelFilter>("all");
const [radius, setRadius]     = useState<number | null>(null);  // null = server decides
const [selectedId, setSelectedId] = useState<string | null>(null);
const searched = query.trim().length > 0;
```

The `typed` / `query` split is the important one. `typed` moves on every keystroke;
`query` only changes on form submit or on IP auto-detect, so the map and the
station list do not refetch per character.

`radius` is `number | null` rather than a number with a default. `null` means "let
the server size the search from what it matched" — see section 6.

### Two queries, not one

```ts
const stationsQ = useQuery({ queryKey: ["stations", query, level, radius], ... });
const allQ      = useQuery({ queryKey: ["stations", query, "all", radius], ... });
```

`stationsQ` is what the map and list draw. `allQ` is always unfiltered, and exists
only so the filter pills can show counts that read as "what is out there" rather
than "what is left after the filter I already applied".

`center` falls back from `stationsQ.data?.center` to `allQ.data?.center`, so the map
still has somewhere to point if the filtered request failed.

`placeholderData` keeps previous results on screen while the next set loads, but
only while the place is unchanged:

```ts
placeholderData: (prev, prevQuery) =>
  (prevQuery?.queryKey as unknown[] | undefined)?.[1] === query ? prev : undefined,
```

Without it the map unmounts on every pill click and redraws its tiles from
scratch. Carrying it across a *new* search would be wrong for a different reason:
the response carries the matched place's name and radius, so the toolbar would keep
naming the old city, and the "widen the search" offer would be answering for a
search nobody is running any more.

`staleTime` is 30 minutes and `retry` is 1.

### URL round-trip

Submitting rewrites the URL with `history.replaceState` — `?q=Atlanta,%20GA` — so a
shared link reopens the same search. The legacy `?zip=` key is still read on load,
because links shared before free-text search landed carry it.

Note this bypasses React Router, which is why the site's analytics never sees a
search (see section 12).

### IP auto-detect

On mount, and only when the URL carried no `?q=`, the page tries to fill the search
box from the visitor's IP: `/api/geo` first (Vercel edge headers, no rate limit),
falling back to `https://ipapi.co/json/` only if that yields no 5-digit US postal
code. A shared link always wins over geolocation. A `cancelled` flag guards against
setting state after unmount.

### States on screen

- Loading — spinner in the map slot while `stationsQ.isLoading || detecting` and no center yet.
- Refetching — a small "Updating" pill over the map instead of blocking it, when `isFetching && center`.
- Empty — "No chargers within N miles of X", plus a "Search 50 miles instead" button when the match was not already a state-sized one.
- Error — the thrown message, a retry button, and a pointer to the official locator.

## 4. Domain helpers — `src/lib/stations.ts`

Pure module, no React. This is where the DC fast / Level 2 distinction lives.

### Two port counts, never a boolean

AFDC returns `ev_dc_fast_num` and `ev_level2_evse_num`. They are carried through as
numbers, because "2 DC fast" and "20 DC fast" are different stops.

### Two types, deliberately different

```ts
export type StationKind = "dc" | "both" | "l2" | "other";     // what a station IS
export type LevelFilter = "all" | "dc_fast" | "level2";       // what the visitor PICKED
```

Four kinds, three filters. `both` is common — a fast charger with Level 2 beside
it — and is exactly the case a boolean would lose.

```ts
export const kindOf = (s: Pick<Station, "dcFast" | "level2">): StationKind =>
  s.dcFast > 0 && s.level2 > 0 ? "both" : s.dcFast > 0 ? "dc" : s.level2 > 0 ? "l2" : "other";
```

### One color table, three surfaces

```ts
export const KIND_COLORS: Record<StationKind, string> = {
  dc:    "#c2410c", // DC fast — orange
  both:  "#1f7a4d", // both kinds — green
  l2:    "#0057b8", // Level 2 — blue
  other: "#64748b", // nothing reported — grey
};
```

Concrete hex, not Tailwind CSS variables. These are painted into Leaflet's own DOM,
outside the Tailwind theme, and a `var()` that failed to resolve renders an
invisible pin. The same table feeds the map pins, the on-page legend and the
station-list dots, so a color always means the same thing.

### Other helpers

- `matchesLevel(station, level)` — a `both` station passes either single-kind filter.
- `connectorLabel` — NREL codes to plug names: `J1772COMBO` to `CCS`, `TESLA` to `NACS (Tesla)`, `CHADEMO` to `CHAdeMO`. Unknown codes pass through unchanged rather than becoming a placeholder.
- `portSummary` — "16 DC fast · 4 Level 2", or "Ports not reported".
- `distanceLabel` — one decimal under 10 miles, rounded above.
- `canonicalPlace` — trim, collapse inner whitespace runs, lowercase. Geocoders do not care; the CDN does, because the response is cached per URL for a day.
- `stationsQuery` — omits `level` when it is `all` and omits `radius` unless the visitor picked one, again to avoid fragmenting the cache across equivalent URLs.
- `fetchStations` — `fetch("/api/stations?" + stationsQuery(...))`, throws `data?.error` on a non-ok response.

## 5. The proxy — `api/stations.ts`

A Vercel serverless function, GET only (405 otherwise).

| Concern | Value |
| --- | --- |
| Upstream | `https://developer.nlr.gov/api/alt-fuel-stations/v1/nearest.json` |
| Key | `process.env.NREL_API_KEY` falling back to `DEMO_KEY` |
| Fixed params | `fuel_type=ELEC`, `access=public`, `status=E` |
| Level filter | `ev_charging_level` set to `2` or `dc_fast`, only when level is not `all` |
| Radius | `Math.min(Math.max(asked ?? place.radius, 1), MAX_RADIUS)`, MAX_RADIUS 500 |
| Limit | `MAX_RESULTS` (200), fixed, not client-adjustable |
| Cache | `public, s-maxage=86400, stale-while-revalidate=604800` |
| Retries | 3 attempts, 500ms then 1000ms backoff, only on 429 / 5xx / network |

Accepted query params: `q` (or legacy `zip`, truncated to `MAX_QUERY` 120 chars),
`level`, optional `radius`, and optional `lat` / `lon` which bypass geocoding
entirely and build a synthetic place with a 15-mile radius.

Why a proxy at all:

1. The API key stays server-side.
2. One CDN-cached response serves every visitor asking about the same place, which is what keeps aggregate traffic inside the upstream rate limit. There is no explicit rate limiter — caching *is* the strategy, and `MAX_QUERY` bounds how many distinct cache entries a bored visitor can create.
3. NREL dropped its own `location` parameter in February 2025, so free text has to be resolved to coordinates before the station call anyway.
4. A station row is roughly 60 fields of which the map uses ten. `trim()` cuts it down to `id, name, address, city, state, zip, lat, lon, distance, dcFast, level2, connectors, network, pricing, hours`. Rows with unusable coordinates are dropped rather than surfaced.

Success response:

```json
{ "center": { "lat": 0, "lon": 0, "city": "", "state": "" },
  "label": "Atlanta, GA", "kind": "city", "radius": 13, "stations": [] }
```

Failure statuses: 400 (bad level, or no text and no coordinates), 404 (nothing
resolved, with the typed text echoed back), 429 (upstream throttled), 502
(anything else). Errors carry a human sentence, which the page renders verbatim.

## 6. Geocoding — `api/_geocode.ts`

`resolveQuery(text)` returns `{ lat, lon, label, kind, radius }` or null.

Three paths:

1. **Bare 5-digit ZIP** — Zippopotam (`api.zippopotam.us/us`), Nominatim as fallback. Photon is never used here.
2. **Exact US state name or abbreviation** — matched against a hardcoded 51-entry table first, then still geocoded. The table does not hold coordinates; it swaps ambiguous typed text ("GA") for unambiguous text ("Georgia") and supplies the final label, then `geocodePlace` runs normally.
3. **Everything else** (city, county, street address, landmark) — Photon (`photon.komoot.io`), Nominatim as fallback.

Both providers are pinned to the US on every call — `countrycode=us` for Photon,
`countrycodes=us` for Nominatim. This is load-bearing, not defensive: unpinned,
Photon answers "GA" with Gainesville, Florida, "Georgia" with the country in the
Caucasus, and "30010" with a postcode in Spain.

`classifyPlace` derives the `PlaceKind` from the result: a `housenumber` always
means "address" regardless of the OSM tag (a college and a government building both
have one and would be missed by a tag allowlist); unknown values default to
"address", the narrower guess.

`radiusForPlace` sizes the search from the match's bounding box rather than using
one fixed number — roughly 15 miles for a ZIP or address, 12 to 35 for a city, 25
to 60 for a county, 60 to 500 for a state. Atlanta works out at about 13, Georgia
about 220, Alaska clamps at the API ceiling. This is what makes a state search mean
anything.

Every fetch is wrapped in a 4-second `AbortController` timeout. Nothing is cached
in this file; the combined geocode-plus-stations response is cached one layer up, so
the same query is effectively geocoded once per day at the CDN.

`api/geo.ts` is unrelated to free-text search. It echoes `x-vercel-ip-country`,
`-country-region`, `-city`, `-postal-code`, `-latitude`, `-longitude` as JSON with
`Cache-Control: no-store`. It is preferred over third-party IP lookups because
ipapi.co's free tier is throttled and frequently blocked; ipapi.co survives only as
the fallback.

## 7. The map — `src/components/ChargerMap.tsx`

Lazy-loaded so Leaflet never ships to pages without a map:

```ts
const ChargerMap = lazy(() => import("@/components/ChargerMap"));
// rendered only when `searched && center`, inside <Suspense>
```

Leaflet with keyless raster OpenStreetMap tiles. MapLibre was tried and rejected:
its WebGL and worker vector-tile path left every source unloaded in both v5 and v6
with no error raised, and a map that fails invisibly is worse than a plainer one
that works. CARTO, Stadia and MapTiler all stamp "API KEY REQUIRED" across an
unkeyed map. OSM's attribution string must stay.

Two effects, on purpose:

- **Mount-only** — builds one `L.map` with `scrollWheelZoom: false` (the map sits mid-page; a visitor scrolling past should scroll the page), adds the tile layer and an empty `L.layerGroup` for markers. Cleanup calls `m.remove()`.
- **On `[stations, center]`** — clears and refills the layer group, then `fitBounds(...).pad(0.15)` with `maxZoom: 14`, or `setView(center, 11)` when there are no results. The map instance itself is never rebuilt; doing so would refetch every tile and flash the whole map on a filter click.

A third effect on `[selectedId]` pans to a marker with
`setView(latlng, Math.max(zoom, 13))` — zooms in, never out — and opens its popup.
It is driven by `showOnMap(id)` on the page, which also scrolls the map into view,
respecting `prefers-reduced-motion`.

Pins are `L.divIcon` teardrops with an inline SVG, filled from `KIND_COLORS`, with a
white bolt cutout so kind stays legible without color. Popup HTML is hand-built and
every dynamic field goes through `escapeHtml` — station data is an external feed and
must never be injected raw.

## 8. The DC fast / Level 2 filter, end to end

The one interaction the page exists for, traced through every layer:

1. **Feed** — two integers per station, `ev_dc_fast_num` and `ev_level2_evse_num`.
2. **Proxy** — passes the filter upstream as `ev_charging_level=2` or `dc_fast`, so a filtered view fetches only what it draws. `all` sends nothing.
3. **Client types** — `LevelFilter` (`all` / `dc_fast` / `level2`) for the pick, `StationKind` (`dc` / `both` / `l2` / `other`) for the station, `kindOf` between them.
4. **UI** — `LEVELS` is declared as data with a label and a hint, rendered as three buttons inside one rounded container so it reads as a single switch with three positions. `aria-pressed` per button, hint in `title`.
5. **Click** — `setLevel(key)` plus `setSelectedId(null)`, because the visible set is about to change and an open popup would be stale.
6. **Counts** — each pill carries a badge from the unfiltered `allQ` (`dcFast > 0` and `level2 > 0` counts), gated on `searched && !allQ.isLoading` so a stale zero never flashes.
7. **Mixed stations** — a `both` station counts in both badges and passes either filter. A driver who wants Level 2 can use the L2 ports at a fast-charge site.
8. **Color** — the same `KIND_COLORS` entry paints the pin, the legend swatch and the list dot.

Because `level` is part of the react-query key and the previous data is held across
a pill click, flipping between filters is instant and costs no extra upstream call
after the first of each.

## 9. Site wiring

- **Route** — a plain hardcoded `Route path="/find-a-charger"` in `src/App.tsx`. Vercel rewrites every non-`/api` path to `index.html`, so React Router matches client-side.
- **Sitemap** — `sitemap-urls.ts:54`, cross-checked against App.tsx's route literals by a test so it cannot go stale.
- **SEO** — no per-page `SeoHead`, so both browsers and crawlers get the site default card. `SeoRouteHead` still sets the canonical URL, and marks `?embed=1` as `noindex,nofollow`.
- **Links** — three hand-maintained registries plus one hardcoded button: `src/lib/site-links.ts` (CMS link picker), `src/data/footer.ts` (labelled "Find Charging Stations"), and a button appended after the CMS-driven nav items in `Navbar.tsx` so an editor cannot remove it.

## 10. Embed mode

Four separate lists must agree for a partner embed to work. They have drifted
before.

1. `public/embed.js` — the partner-facing loader's `TOOLS` map.
2. `middleware.ts` — `EMBED_TOOL_PATHS`; a request with `?embed=1` on one of these exact paths skips the `etu_gate` cookie check that otherwise 401s every visitor.
3. `vercel.json` — the enforced `X-Frame-Options: DENY` and `frame-ancestors 'none'` pair is scoped to `/admin` only; everywhere else the CSP is report-only with `frame-ancestors *`, which is what makes framing possible at all.
4. The page itself — `new URLSearchParams(window.location.search).get("embed") === "1"`.

In embed mode the page hides the navbar and footer, drops the hero gradient band,
shrinks top padding, and renders a "Powered by Electrifying the US" attribution link
instead. `useEmbedFrame` adds `.embed` to the html element, applies a host-supplied
`?font=`, and posts `{ type: "etu-embed-size", height }` to `window.parent` on a
ResizeObserver so the iframe can size itself. `ContactWidget` does its own
`?embed=1` check and returns null.

## 11. Environment

| Variable | Used by | Notes |
| --- | --- | --- |
| `NREL_API_KEY` | `api/stations.ts`, `api/incentives.ts` | Free key from the provider. Falls back to the shared `DEMO_KEY`, which is throttled per egress IP and shared between both endpoints. Not currently listed in `.env.example`. |

No key is needed for Photon, Nominatim, Zippopotam, the OSM tile server, or
`api/geo.ts` (which reads Vercel's own request headers).

## 12. Known gaps

Carry these forward as things to fix, not to copy.

- **No analytics on searches.** Both trackers fire on React Router's `useLocation`, and search submits use raw `history.replaceState`, so nobody knows what visitors type or how often a search returns nothing.
- **No tests above the pure helpers.** Only `stations.test.ts` and `_geocode.test.ts` exist. There is no test for the page, the map, the share flow or embed mode.
- **`matchesLevel` is dead code.** It is exported and tested but nothing in `src/` or `api/` calls it — the rule it encodes is enforced upstream by `ev_charging_level` and by the `counts` filters.
- **`NREL_API_KEY` is not in `.env.example`.** The code documents it in a header comment only. `RESEND_API_KEY` has the same problem.
- **No alerting on feed failure.** A sustained upstream outage or a `DEMO_KEY` throttle degrades the page silently; other flows fire a Slack alert.
- **The DEMO_KEY quota is shared** with `api/incentives.ts`, which hits the same host.
- **No screen-reader announcement.** The result count, empty state and error card carry no `aria-live` or `role="status"`.
- **CSP is still report-only**, and `docs/security-headers.md` lists this page as unverified under enforcement — whether OSM tiles and the ipapi.co fallback survive the real policy is untested.
- **`EvCharging101.tsx` and the assistant** both describe finding a charger and point at the external federal locator instead of linking to this tool.

## 13. Recipe for the next tool

The pattern generalises to any page that fronts a third-party dataset.

1. **Put a serverless proxy in front of the upstream API.** The key stays server-side, one cached response serves everyone, and you get to trim the payload to what you actually render.
2. **Cache hard at the CDN and treat that as the rate limiter.** Pick `s-maxage` from how often the source really changes. Bound the input length so the cache cannot be fragmented on purpose.
3. **Canonicalise the cache key client-side** — trim, collapse whitespace, lowercase — and omit any parameter that equals the default.
4. **Resolve ambiguous input yourself.** A general-purpose geocoder or search API is wrong in specific, repeatable ways; pin the scope, special-case the values you know are ambiguous, and default to the narrower interpretation.
5. **Size the query from what was matched**, rather than sending one fixed radius or page size for every kind of input.
6. **Model the domain distinction as its own type**, separate from the filter the visitor picks, and give the overlapping case a real name.
7. **One table for color and label**, shared by every surface, in concrete values if any of those surfaces sits outside the theme.
8. **Two queries when counts must be honest** — one filtered for the view, one unfiltered for the badges.
9. **Hold previous data across a filter change but not across a new search**, and key the query on everything that changes the answer.
10. **Lazy-load anything heavy** and render it only once you have something to draw.
11. **Escape every external string** before it reaches innerHTML.
12. **Round-trip the search into the URL** so links are shareable — and fire analytics yourself if you bypass the router to do it.
13. **Add the path to all four embed lists** if it is meant to be embeddable, and to the sitemap and link registries if it is meant to be found.
