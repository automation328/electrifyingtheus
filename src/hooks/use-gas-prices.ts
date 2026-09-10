import { useEffect, useMemo, useState } from "react";
import { STATE_ENERGY_RATES } from "@/data/state-energy-rates";
import { SOURCES, type SourceMeta } from "@/data/sources";

// Live per-state regular-gasoline averages, served by the n8n `/gas-prices`
// webhook (AAA daily data, fetched server-side + CORS-enabled). Results are
// cached in localStorage so we hit the proxy at most once per TTL per visitor,
// and we fall back to cached/static values if the network is unavailable.

export interface GasPrices {
  /** USPS state code → regular price per gallon (e.g. { CA: 6.109 }). */
  prices: Record<string, number>;
  national: number | null;
  updatedAt: string | null;
  source: string | null;
}

const GAS_URL = (import.meta as { env?: Record<string, string> }).env?.VITE_GAS_PRICES_URL;
const CACHE_KEY = "evg-gas-prices-v1";
const TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

export function useGasPrices(): { data: GasPrices | null; loading: boolean } {
  const [data, setData] = useState<GasPrices | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // 1) Hydrate immediately from cache so the map never waits on the network.
    let cached: { ts: number; data: GasPrices } | null = null;
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) cached = JSON.parse(raw);
    } catch {
      /* ignore corrupt cache */
    }
    if (cached?.data?.prices) {
      setData(cached.data);
      setLoading(false);
    }

    const isFresh = cached && Date.now() - cached.ts < TTL_MS;
    if (!GAS_URL || isFresh) {
      setLoading(false);
      return;
    }

    // 2) Refresh in the background (covers first load and stale cache).
    (async () => {
      try {
        const res = await fetch(GAS_URL);
        if (!res.ok) throw new Error(`gas-prices ${res.status}`);
        const j = await res.json();
        const next: GasPrices = {
          prices: (j?.prices as Record<string, number>) ?? {},
          national: typeof j?.national === "number" ? j.national : null,
          updatedAt: j?.updatedAt ?? null,
          source: j?.source ?? null,
        };
        if (cancelled) return;
        if (Object.keys(next.prices).length > 0) {
          setData(next);
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data: next }));
          } catch {
            /* storage full / blocked — non-fatal */
          }
        }
      } catch {
        /* offline / blocked — keep cached (or null → static fallback) */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading };
}

/**
 * Median of a state-code → price map, e.g. the feed's `prices`.
 *
 * Not interchangeable with the feed's `national`, which is the unweighted mean
 * of the 51 state prices: a handful of very expensive states (CA, WA, HI) pull
 * that mean roughly a dime above the median, so a figure labelled "median" has
 * to be computed here rather than read off `national`.
 *
 * Returns null for an absent or empty map so callers can fall back.
 */
export function medianGasPrice(prices: Record<string, number> | null | undefined): number | null {
  const sorted = Object.values(prices ?? {})
    .filter((n): n is number => typeof n === "number" && Number.isFinite(n))
    .sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export interface StateGasPrice {
  code: string;
  name: string;
  price: number;
}

/**
 * Resolve one state's gas price live-first, static as fallback.
 * Falls back per state rather than to a single national constant, so a feed that
 * is missing one state still prices the other fifty from live data.
 */
export function resolveStateGasPrice(code: string, prices?: Record<string, number> | null): number {
  return prices?.[code] ?? STATE_ENERGY_RATES[code]?.gasPricePerGallon;
}

/**
 * Cheapest and most expensive state, live-first.
 *
 * Both are computed, never assumed: the cheapest state in particular moves
 * around (Indiana, Mississippi and Oklahoma have all held it recently), so
 * hardcoding a name next to a live price produces a true number under a false
 * label.
 */
export function useGasExtremes(): { low: StateGasPrice; high: StateGasPrice } {
  const { data } = useGasPrices();
  return useMemo(() => gasExtremes(data?.prices), [data]);
}

/** Pure core of {@link useGasExtremes}, so it can be unit-tested without React. */
export function gasExtremes(prices?: Record<string, number> | null): { low: StateGasPrice; high: StateGasPrice } {
  const entries: StateGasPrice[] = Object.keys(STATE_ENERGY_RATES).map((code) => ({
    code,
    name: STATE_ENERGY_RATES[code].name,
    price: resolveStateGasPrice(code, prices),
  }));
  let low = entries[0];
  let high = entries[0];
  for (const e of entries) {
    if (e.price < low.price) low = e;
    if (e.price > high.price) high = e;
  }
  return { low, high };
}

/**
 * Provenance for whichever gas figure is actually on screen.
 *
 * The curated `SOURCES.gas.asOf` date describes the static fallback table, so
 * showing it beside a live figure misreports a number fetched today as months
 * old. A live figure carries the feed's own timestamp instead.
 */
export function gasSourceMeta(data: GasPrices | null | undefined): SourceMeta {
  const when = data?.updatedAt ? new Date(data.updatedAt) : null;
  if (!when || Number.isNaN(when.getTime()) || Object.keys(data?.prices ?? {}).length === 0) {
    return SOURCES.gas;
  }
  return {
    label: `${data.source ?? "AAA"} daily state average · live`,
    href: SOURCES.gas.href,
    asOf: when.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
  };
}
