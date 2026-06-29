// Internal analytics dashboard — /admin. Password-gated (ANALYTICS_PASSWORD,
// verified server-side by /api/analytics).
//
// Design: a "telemetry cockpit" for the EV-adoption movement — the team reads
// the site's current (traffic) like an EV instrument cluster on a night drive.
// Dark void, dual cyan/mint signal, monospaced odometer numerals, a radial charge
// gauge, and the traffic chart drawn as a charging curve. Theme is admin-scoped
// (fonts + styles injected here), so it never touches the public site.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Zap, RefreshCw, LogOut } from "lucide-react";
import { format, parseISO } from "date-fns";

const PW_KEY = "etu_analytics_key";
const RANGES = [
  { key: "24h", label: "24H" },
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "90d", label: "90D" },
];
const RANGE_LABEL: Record<string, string> = { "24h": "last 24 hours", "7d": "last 7 days", "30d": "last 30 days", "90d": "last 90 days" };

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  void: "#07110E", panel: "#0E1B16", panel2: "#0B1713", line: "#1C2F28",
  ink: "#E8F3EC", mute: "#7E9A8F", faint: "#54716A",
  mint: "#43F2A3", cyan: "#36C6F4", amber: "#FFB454",
};

const nf = new Intl.NumberFormat("en-US");

interface Totals {
  pageviews: number; clicks: number; sessions: number; visitors: number;
  knownVisitors: number; leads: number; knownViews: number; anonViews: number;
}
interface Bar { key: string; count: number }
interface PageRow { key: string; count: number; visitors: number }
interface Data {
  range: string;
  totals: Totals;
  series: { date: string; views: number; sessions: number }[];
  pages: PageRow[];
  topReferrers: Bar[]; topCountries: Bar[]; topCities: Bar[]; topClicks: Bar[];
  recentKnown: { name: string; email: string; path: string; place: string; when: string }[];
}

async function fetchAnalytics(password: string, range: string): Promise<{ ok: boolean; status: number; data?: Data }> {
  const res = await fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password, range }),
  });
  if (!res.ok) return { ok: false, status: res.status };
  return { ok: true, status: 200, data: (await res.json()) as Data };
}

// ── Scoped theme (fonts + keyframes) ─────────────────────────────────────────
const THEME_CSS = `
.tg-disp{font-family:'Space Grotesk',system-ui,sans-serif}
.tg-mono{font-family:'JetBrains Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums}
@keyframes tg-pulse{0%,100%{opacity:.3;transform:scale(1)}50%{opacity:.9;transform:scale(1.35)}}
@keyframes tg-blink{0%,100%{opacity:1}50%{opacity:.2}}
.tg-node{transform-box:fill-box;transform-origin:center;animation:tg-pulse 1.9s ease-in-out infinite}
.tg-live{animation:tg-blink 1.7s ease-in-out infinite}
.tg-scan{background-image:linear-gradient(${C.mint}0a 1px,transparent 1px);background-size:100% 4px}
.tg-focus:focus-visible{outline:2px solid ${C.mint};outline-offset:2px}
.tg-row{transition:background .15s,border-color .15s}
.tg-row:hover{background:${C.panel}}
.tg-scroll::-webkit-scrollbar{width:8px;height:8px}
.tg-scroll::-webkit-scrollbar-thumb{background:${C.line};border-radius:99px}
.tg-scroll{scrollbar-width:thin;scrollbar-color:${C.line} transparent}
@media (prefers-reduced-motion: reduce){.tg-node,.tg-live{animation:none}}
`;

function useTheme() {
  useEffect(() => {
    if (!document.getElementById("tg-fonts")) {
      const l = document.createElement("link");
      l.id = "tg-fonts"; l.rel = "stylesheet";
      l.href = "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap";
      document.head.appendChild(l);
    }
    if (!document.getElementById("tg-style")) {
      const s = document.createElement("style");
      s.id = "tg-style"; s.textContent = THEME_CSS;
      document.head.appendChild(s);
    }
  }, []);
}

// Count-up: numerals roll from 0 to value once (instrument odometer). Respects
// reduced motion. Re-runs when the value changes (range switch / refresh).
function useCountUp(value: number): number {
  const [n, setN] = useState(value);
  const raf = useRef<number>();
  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || value === 0) { setN(value); return; }
    const start = performance.now(), dur = 750;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [value]);
  return n;
}

/* ── Pieces ───────────────────────────────────────────────────────────────── */

const Eyebrow = ({ children }: { children: React.ReactNode }) => (
  <div className="tg-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: C.faint }}>{children}</div>
);

const Sparkbars = ({ values }: { values: number[] }) => {
  const max = Math.max(1, ...values);
  const v = values.slice(-32);
  return (
    <div className="flex items-end gap-[2px] h-7 pb-[3px]" style={{ borderBottom: `1px solid ${C.line}` }} aria-hidden>
      {v.map((x, i) => (
        <div key={i} className="flex-1 rounded-[1px]" style={{ height: `${Math.max(4, (x / max) * 100)}%`, background: i === v.length - 1 ? C.mint : `${C.line}` }} />
      ))}
    </div>
  );
};

const Stat = ({ label, value, big }: { label: string; value: number; big?: boolean }) => {
  const n = useCountUp(value);
  return (
    <div>
      <Eyebrow>{label}</Eyebrow>
      <div className={`tg-mono font-bold leading-none mt-1.5 ${big ? "text-5xl md:text-6xl" : "text-2xl"}`} style={{ color: C.ink }}>
        {nf.format(n)}
      </div>
    </div>
  );
};

// Radial charge gauge — a real 0–100 ratio (known-visitor share).
const Gauge = ({ pct, label }: { pct: number; label: string }) => {
  const shown = useCountUp(pct);
  const size = 128, stroke = 9, r = (size - stroke) / 2, c = size / 2;
  const circ = 2 * Math.PI * r, arc = 0.75 * circ;
  const rot = `rotate(135 ${c} ${c})`;
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <defs>
            <linearGradient id="tgGauge" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={C.cyan} /><stop offset="100%" stopColor={C.mint} />
            </linearGradient>
          </defs>
          <circle cx={c} cy={c} r={r} fill="none" stroke={C.line} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${arc} ${circ}`} transform={rot} />
          <circle cx={c} cy={c} r={r} fill="none" stroke="url(#tgGauge)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={`${(shown / 100) * arc} ${circ}`} transform={rot} style={{ transition: "stroke-dasharray .2s" }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="tg-mono text-3xl font-bold" style={{ color: C.ink }}>{shown}<span className="text-base" style={{ color: C.mute }}>%</span></div>
        </div>
      </div>
      <div className="tg-mono text-[10px] tracking-[0.18em] uppercase mt-1" style={{ color: C.faint }}>{label}</div>
    </div>
  );
};

const Panel = ({ children, className = "", pad = true }: { children: React.ReactNode; className?: string; pad?: boolean }) => (
  <div className={`rounded-lg ${pad ? "p-5" : ""} ${className}`} style={{ background: C.panel2, border: `1px solid ${C.line}` }}>{children}</div>
);

const MiniList = ({ title, items, empty, unit }: { title: string; items: Bar[]; empty: string; unit?: string }) => {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <Panel className="min-w-0">
      <Eyebrow>{title}</Eyebrow>
      {items.length === 0 ? (
        <p className="tg-mono text-xs mt-3" style={{ color: C.faint }}>{empty}</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {items.map((it) => (
            <li key={it.key}>
              <div className="flex items-center justify-between gap-3 mb-1">
                <span className="tg-disp text-sm truncate min-w-0" style={{ color: C.ink }} title={it.key}>{it.key}</span>
                <span className="tg-mono text-xs shrink-0" style={{ color: C.mute }}>{nf.format(it.count)}{unit ? ` ${unit}` : ""}</span>
              </div>
              <div className="h-[3px] rounded-full overflow-hidden" style={{ background: C.line }}>
                <div className="h-full rounded-full" style={{ width: `${(it.count / max) * 100}%`, background: `linear-gradient(90deg, ${C.cyan}, ${C.mint})` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
};

/* ── Login ───────────────────────────────────────────────────────────────── */

const Login = ({ onSubmit, error }: { onSubmit: (pw: string) => void; error: string }) => {
  const [pw, setPw] = useState("");
  return (
    <div className="min-h-screen flex items-center justify-center px-4 tg-scan" style={{ background: C.void }}>
      <form
        onSubmit={(e) => { e.preventDefault(); onSubmit(pw); }}
        className="w-full max-w-sm rounded-xl p-8"
        style={{ background: C.panel2, border: `1px solid ${C.line}`, boxShadow: `0 0 60px ${C.mint}11` }}
      >
        <div className="w-11 h-11 rounded-lg flex items-center justify-center mb-6" style={{ border: `1px solid ${C.mint}66`, boxShadow: `0 0 22px ${C.mint}22` }}>
          <Zap className="w-5 h-5" style={{ color: C.mint }} fill={C.mint} />
        </div>
        <Eyebrow>Restricted · ETU telemetry</Eyebrow>
        <h1 className="tg-disp text-2xl font-bold mt-2 mb-1" style={{ color: C.ink }}>Access key</h1>
        <p className="tg-disp text-sm mb-6" style={{ color: C.mute }}>Enter your key to read site telemetry.</p>
        <input
          type="password"
          autoFocus
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="••••••••••"
          className="tg-mono tg-focus w-full rounded-md px-4 py-3 mb-3 outline-none"
          style={{ background: C.void, border: `1px solid ${C.line}`, color: C.ink }}
        />
        {error && <p className="tg-mono text-xs mb-3" style={{ color: C.amber }}>{error}</p>}
        <button type="submit" className="tg-disp tg-focus w-full rounded-md font-semibold py-3 transition-opacity hover:opacity-90"
          style={{ background: `linear-gradient(90deg, ${C.cyan}, ${C.mint})`, color: C.void }}>
          Unlock
        </button>
      </form>
    </div>
  );
};

/* ── Dashboard ───────────────────────────────────────────────────────────── */

const AdminDashboard = () => {
  useTheme();
  const [password, setPassword] = useState<string | null>(() => {
    try { return localStorage.getItem(PW_KEY); } catch { return null; }
  });
  const [range, setRange] = useState("7d");
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginError, setLoginError] = useState("");

  const load = useCallback(async (pw: string, r: string) => {
    setLoading(true); setError("");
    try {
      const out = await fetchAnalytics(pw, r);
      if (out.status === 401) {
        setLoginError("Key not recognized.");
        setPassword(null);
        try { localStorage.removeItem(PW_KEY); } catch { /* ignore */ }
        return;
      }
      if (!out.ok || !out.data) {
        setError(out.status === 500 ? "Telemetry isn't fully wired yet (service role key / table)." : "Couldn't reach the telemetry feed.");
        return;
      }
      setData(out.data);
    } catch {
      setError("Network error — the telemetry feed didn't respond.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (password) load(password, range);
  }, [password, range, load]);

  const onLogin = (pw: string) => {
    if (!pw) { setLoginError("Enter your access key."); return; }
    setLoginError("");
    try { localStorage.setItem(PW_KEY, pw); } catch { /* ignore */ }
    setPassword(pw);
  };

  const logout = () => {
    try { localStorage.removeItem(PW_KEY); } catch { /* ignore */ }
    setPassword(null); setData(null);
  };

  if (!password) return <Login onSubmit={onLogin} error={loginError} />;

  const t = data?.totals;
  const knownShare = t && t.pageviews > 0 ? Math.round((t.knownViews / t.pageviews) * 100) : 0;
  const lastIdx = data ? data.series.length - 1 : -1;

  // Custom charge-node on the latest point only (a pulsing dot, the "live charge").
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ChargeNode = (props: any) => {
    const { cx, cy, index } = props;
    if (cx == null || index !== lastIdx) return null;
    return (
      <g>
        <circle cx={cx} cy={cy} r={7} fill={C.mint} className="tg-node" />
        <circle cx={cx} cy={cy} r={3} fill={C.mint} stroke={C.void} strokeWidth={1.5} />
      </g>
    );
  };

  return (
    <div className="min-h-screen tg-disp" style={{ background: C.void }}>
      {/* Status bar */}
      <header className="sticky top-0 z-10 tg-scan" style={{ background: `${C.void}f2`, borderBottom: `1px solid ${C.line}`, backdropFilter: "blur(6px)" }}>
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-3.5 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2.5 mr-auto">
            <div className="w-9 h-9 rounded-md flex items-center justify-center" style={{ border: `1px solid ${C.mint}55`, boxShadow: `0 0 18px ${C.mint}22` }}>
              <Zap className="w-4 h-4" style={{ color: C.mint }} fill={C.mint} />
            </div>
            <div className="leading-tight">
              <div className="tg-disp font-bold tracking-tight" style={{ color: C.ink }}>
                Electrifying<span style={{ color: C.mint }}>·</span>US
              </div>
              <div className="tg-mono text-[10px] tracking-[0.22em] uppercase" style={{ color: C.faint }}>
                <span className="tg-live" style={{ color: C.mint }}>●</span> Telemetry · first-party
              </div>
            </div>
          </div>

          <div className="flex items-center gap-0.5 rounded-md p-0.5" style={{ border: `1px solid ${C.line}`, background: C.panel2 }}>
            {RANGES.map((r) => {
              const on = range === r.key;
              return (
                <button key={r.key} onClick={() => setRange(r.key)}
                  className="tg-mono tg-focus text-xs px-3 py-1.5 rounded transition-colors"
                  style={on ? { background: `${C.mint}1c`, color: C.mint } : { color: C.mute }}>
                  {r.label}
                </button>
              );
            })}
          </div>
          <button onClick={() => load(password, range)} title="Refresh"
            className="tg-focus p-2 rounded-md transition-colors" style={{ border: `1px solid ${C.line}`, color: C.mute }}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={logout} title="Sign out"
            className="tg-focus p-2 rounded-md transition-colors" style={{ border: `1px solid ${C.line}`, color: C.mute }}>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 space-y-5">
        {error && (
          <Panel className="!border-0" >
            <div style={{ color: C.amber }} className="tg-mono text-sm">{error}</div>
          </Panel>
        )}

        {!data && loading && (
          <div className="py-28 text-center tg-mono text-sm" style={{ color: C.mute }}>Reading telemetry…</div>
        )}

        {data && t && (
          <>
            {/* Instrument cluster */}
            <Panel className="overflow-hidden">
              <div className="flex items-center justify-between mb-5">
                <Eyebrow>Live readout · {RANGE_LABEL[range]}</Eyebrow>
                <span className="tg-mono text-[10px] tracking-[0.18em] uppercase" style={{ color: C.faint }}>
                  {nf.format(t.anonViews)} anon · {nf.format(t.knownViews)} known
                </span>
              </div>
              <div className="grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.6fr)_auto] gap-6 lg:gap-8 items-center">
                {/* Primary */}
                <div>
                  <Stat label="Pageviews" value={t.pageviews} big />
                  <div className="mt-3"><Sparkbars values={data.series.map((s) => s.views)} /></div>
                </div>
                {/* Secondary 2×2 */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-5 lg:border-x lg:px-8" style={{ borderColor: C.line }}>
                  <Stat label="Sessions" value={t.sessions} />
                  <Stat label="Unique visitors" value={t.visitors} />
                  <Stat label="Interactions" value={t.clicks} />
                  <Stat label="Leads" value={t.leads} />
                </div>
                {/* Gauge */}
                <div className="justify-self-center"><Gauge pct={knownShare} label="Known share" /></div>
              </div>
            </Panel>

            {/* Throughput — charging curve */}
            <Panel>
              <div className="flex items-center justify-between mb-4">
                <Eyebrow>Throughput · pageviews &amp; sessions</Eyebrow>
                <div className="flex items-center gap-4 tg-mono text-[10px] uppercase tracking-wider">
                  <span className="flex items-center gap-1.5" style={{ color: C.mute }}><span className="w-3 h-[2px] inline-block" style={{ background: C.mint }} /> Views</span>
                  <span className="flex items-center gap-1.5" style={{ color: C.mute }}><span className="w-3 h-[2px] inline-block" style={{ background: C.cyan }} /> Sessions</span>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.series} margin={{ top: 6, right: 10, left: -18, bottom: 0 }}>
                    <defs>
                      <linearGradient id="tgFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={C.mint} stopOpacity={0.28} />
                        <stop offset="100%" stopColor={C.mint} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="tgStroke" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={C.cyan} /><stop offset="100%" stopColor={C.mint} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={C.line} strokeDasharray="2 5" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => { try { return format(parseISO(d), range === "24h" ? "ha" : "MMM d"); } catch { return d; } }}
                      tick={{ fontSize: 10, fill: C.faint, fontFamily: "JetBrains Mono, monospace" }}
                      tickLine={false} axisLine={{ stroke: C.line }} minTickGap={26}
                    />
                    <YAxis tick={{ fontSize: 10, fill: C.faint, fontFamily: "JetBrains Mono, monospace" }} tickLine={false} axisLine={false} width={42} allowDecimals={false} />
                    <Tooltip
                      cursor={{ stroke: C.line }}
                      contentStyle={{ borderRadius: 8, border: `1px solid ${C.line}`, background: C.panel, fontSize: 12, fontFamily: "JetBrains Mono, monospace", color: C.ink }}
                      labelStyle={{ color: C.mute }}
                      labelFormatter={(d) => { try { return format(parseISO(String(d)), "EEE, MMM d"); } catch { return String(d); } }}
                    />
                    <Area type="monotone" dataKey="sessions" name="Sessions" stroke={C.cyan} strokeWidth={1.5} strokeOpacity={0.7} fillOpacity={0} dot={false} />
                    <Area type="monotone" dataKey="views" name="Views" stroke="url(#tgStroke)" strokeWidth={2.5} fill="url(#tgFill)" dot={<ChargeNode />} activeDot={{ r: 4, fill: C.mint, stroke: C.void }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            {/* Page views — level meters */}
            <Panel>
              <div className="flex items-center justify-between mb-1">
                <Eyebrow>Page views · views &amp; unique visitors per page</Eyebrow>
                <span className="tg-mono text-[10px] uppercase tracking-wider" style={{ color: C.faint }}>{nf.format(data.pages.length)} pages</span>
              </div>
              {data.pages.length === 0 ? (
                <p className="tg-mono text-xs mt-3" style={{ color: C.faint }}>No signal yet — pageviews appear here as visitors arrive.</p>
              ) : (
                <ul className="mt-3 space-y-2 max-h-[460px] overflow-y-auto tg-scroll pr-1">
                  {(() => { const max = Math.max(1, ...data.pages.map((p) => p.count)); return data.pages.map((p) => {
                    const pct = t.pageviews > 0 ? Math.round((p.count / t.pageviews) * 100) : 0;
                    return (
                      <li key={p.key} className="tg-row rounded-md px-2 py-2" style={{ border: "1px solid transparent" }}>
                        <div className="flex items-baseline justify-between gap-3 mb-1.5">
                          <span className="tg-disp text-sm truncate min-w-0" style={{ color: C.ink }} title={p.key}>{p.key}</span>
                          <span className="tg-mono text-xs shrink-0" style={{ color: C.mute }}>
                            <span style={{ color: C.ink }}>{nf.format(p.count)}</span> view{p.count === 1 ? "" : "s"}
                            <span className="mx-1.5" style={{ color: C.line }}>·</span>
                            {nf.format(p.visitors)} uv
                            <span className="ml-2" style={{ color: C.faint }}>{pct}%</span>
                          </span>
                        </div>
                        <div className="h-[5px] rounded-full overflow-hidden" style={{ background: C.line }}>
                          <div className="h-full rounded-full" style={{ width: `${(p.count / max) * 100}%`, background: `linear-gradient(90deg, ${C.cyan}, ${C.mint})` }} />
                        </div>
                      </li>
                    );
                  }); })()}
                </ul>
              )}
            </Panel>

            {/* Breakdown */}
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <MiniList title="Signal sources · referrers" items={data.topReferrers} empty="No referrers in range." />
              <MiniList title="Interactions · clicks" items={data.topClicks} empty="No interactions in range." />
              <MiniList title="Reach · countries" items={data.topCountries} empty="No location data in range." />
              <MiniList title="Reach · cities" items={data.topCities} empty="No location data in range." />

              {/* Identified visitors — console log */}
              <Panel className="md:col-span-2 xl:col-span-1 min-w-0">
                <Eyebrow>Identified visitors</Eyebrow>
                {data.recentKnown.length === 0 ? (
                  <p className="tg-mono text-xs mt-3" style={{ color: C.faint }}>No identified visitors in range.</p>
                ) : (
                  <ul className="mt-3 space-y-2.5 max-h-[300px] overflow-y-auto tg-scroll pr-1">
                    {data.recentKnown.map((v, i) => (
                      <li key={i} className="tg-mono text-xs leading-relaxed" style={{ borderLeft: `2px solid ${C.mint}55`, paddingLeft: 10 }}>
                        <div className="flex items-center justify-between gap-2">
                          <span style={{ color: C.ink }} className="truncate">{v.name}</span>
                          <span style={{ color: C.faint }} className="shrink-0">{(() => { try { return format(parseISO(v.when), "MMM d · HH:mm"); } catch { return ""; } })()}</span>
                        </div>
                        <div style={{ color: C.mute }} className="truncate">{v.email}</div>
                        <div style={{ color: C.faint }} className="truncate">{v.path}{v.place ? ` · ${v.place}` : ""}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </section>

            <div className="tg-mono text-[10px] tracking-[0.15em] uppercase text-center pt-3 pb-2" style={{ color: C.faint }}>
              ETU // first-party telemetry · {RANGE_LABEL[range]} · {nf.format(t.pageviews)} views · {nf.format(t.clicks)} interactions
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
