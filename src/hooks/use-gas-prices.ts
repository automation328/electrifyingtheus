import { useEffect, useState } from "react";

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
