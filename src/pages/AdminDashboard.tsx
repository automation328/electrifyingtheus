// Internal analytics dashboard — /admin. Password-gated (ANALYTICS_PASSWORD,
// verified server-side by /api/analytics). Shows first-party traffic, clicks,
// geography, and known-visitor conversions stored in site_analytics.

import { useCallback, useEffect, useState } from "react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Activity, MousePointerClick, Users, UserCheck, Eye, Sparkles,
  RefreshCw, LogOut, Lock, MapPin, Link2, FileText, TrendingUp,
} from "lucide-react";
import { format, parseISO } from "date-fns";

const PW_KEY = "etu_analytics_key";
const RANGES = [
  { key: "24h", label: "24h" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
];

interface Totals {
  pageviews: number; clicks: number; sessions: number; visitors: number;
  knownVisitors: number; leads: number; knownViews: number; anonViews: number;
}
interface Bar { key: string; count: number }
interface Data {
  range: string;
  totals: Totals;
  series: { date: string; views: number; sessions: number }[];
  topPages: Bar[]; topReferrers: Bar[]; topCountries: Bar[]; topCities: Bar[]; topClicks: Bar[];
  recentKnown: { name: string; email: string; path: string; place: string; when: string }[];
}

const nf = new Intl.NumberFormat("en-US");

async function fetchAnalytics(password: string, range: string): Promise<{ ok: boolean; status: number; data?: Data }> {
  const res = await fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password, range }),
  });
  if (!res.ok) return { ok: false, status: res.status };
  return { ok: true, status: 200, data: (await res.json()) as Data };
}

/* ── Small presentational pieces ─────────────────────────────────────────── */

const Kpi = ({ icon: Icon, label, value, sub }: { icon: typeof Eye; label: string; value: number; sub?: string }) => (
  <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
    <div className="flex items-center gap-2 text-muted-foreground mb-2">
      <Icon className="w-4 h-4" />
      <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
    </div>
    <div className="text-3xl font-bold font-display text-foreground">{nf.format(value)}</div>
    {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
  </div>
);

const BarList = ({ icon: Icon, title, items, empty }: { icon: typeof Eye; title: string; items: Bar[]; empty: string }) => {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-primary" />
        <h3 className="font-bold font-display text-foreground">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">{empty}</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((it) => (
            <li key={it.key}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-foreground truncate pr-3" title={it.key}>{it.key}</span>
                <span className="text-muted-foreground tabular-nums shrink-0">{nf.format(it.count)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full gradient-hero" style={{ width: `${(it.count / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/* ── Login ───────────────────────────────────────────────────────────────── */

const Login = ({ onSubmit, error }: { onSubmit: (pw: string) => void; error: string }) => {
  const [pw, setPw] = useState("");
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <form
        onSubmit={(e) => { e.preventDefault(); onSubmit(pw); }}
        className="w-full max-w-sm rounded-3xl border border-border bg-card p-8 shadow-elevated"
      >
        <div className="w-12 h-12 rounded-2xl gradient-hero flex items-center justify-center mb-5">
          <Lock className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold font-display text-foreground mb-1">Analytics</h1>
        <p className="text-sm text-muted-foreground mb-6">Internal dashboard — enter the access password.</p>
        <input
          type="password"
          autoFocus
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          placeholder="Password"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/40 mb-3"
        />
        {error && <p className="text-sm text-destructive mb-3">{error}</p>}
        <button type="submit" className="w-full rounded-xl gradient-hero text-white font-semibold py-3 hover:opacity-90 transition-opacity">
          Sign in
        </button>
      </form>
    </div>
  );
};

/* ── Dashboard ───────────────────────────────────────────────────────────── */

const AdminDashboard = () => {
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
        setLoginError("Wrong password.");
        setPassword(null);
        try { localStorage.removeItem(PW_KEY); } catch { /* ignore */ }
        return;
      }
      if (!out.ok || !out.data) {
        setError(out.status === 500 ? "Analytics isn't fully configured yet (service role key / table)." : "Failed to load.");
        return;
      }
      setData(out.data);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (password) load(password, range);
  }, [password, range, load]);

  const onLogin = (pw: string) => {
    if (!pw) { setLoginError("Enter the password."); return; }
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

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="container px-4 py-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 mr-auto">
            <div className="w-9 h-9 rounded-xl gradient-hero flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold font-display text-foreground leading-none">Site Analytics</h1>
              <p className="text-xs text-muted-foreground">electrifyingtheus.com · first-party</p>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                  range === r.key ? "gradient-hero text-white font-semibold" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button onClick={() => load(password, range)} className="p-2 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground transition-colors" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={logout} className="p-2 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground transition-colors" title="Log out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="container px-4 py-6 space-y-6">
        {error && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 text-amber-900 px-5 py-4 text-sm">{error}</div>
        )}

        {!data && loading && (
          <div className="py-24 text-center text-muted-foreground">Loading…</div>
        )}

        {data && t && (
          <>
            {/* KPI cards */}
            <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
              <Kpi icon={Eye} label="Pageviews" value={t.pageviews} />
              <Kpi icon={Activity} label="Sessions" value={t.sessions} />
              <Kpi icon={Users} label="Visitors" value={t.visitors} sub="unique devices" />
              <Kpi icon={UserCheck} label="Known" value={t.knownVisitors} sub="named visitors" />
              <Kpi icon={Sparkles} label="Leads" value={t.leads} sub="unique emails" />
              <Kpi icon={MousePointerClick} label="Clicks" value={t.clicks} />
            </section>

            {/* Traffic over time */}
            <section className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="font-bold font-display text-foreground">Traffic</h3>
                <span className="text-xs text-muted-foreground ml-1">pageviews &amp; sessions</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.series} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => { try { return format(parseISO(d), range === "24h" ? "ha" : "MMM d"); } catch { return d; } }}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false} axisLine={false} minTickGap={24}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={40} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))", fontSize: 12 }}
                      labelFormatter={(d) => { try { return format(parseISO(String(d)), "EEE, MMM d"); } catch { return String(d); } }}
                    />
                    <Area type="monotone" dataKey="views" name="Pageviews" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#gv)" />
                    <Area type="monotone" dataKey="sessions" name="Sessions" stroke="hsl(var(--secondary))" strokeWidth={2} fillOpacity={0} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-5 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded bg-primary inline-block" /> Pageviews</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 rounded bg-secondary inline-block" /> Sessions</span>
                <span className="ml-auto">Known {nf.format(t.knownViews)} · Anonymous {nf.format(t.anonViews)} views</span>
              </div>
            </section>

            {/* Breakdown grid */}
            <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              <BarList icon={FileText} title="Top pages" items={data.topPages} empty="No pageviews yet." />
              <BarList icon={Link2} title="Top referrers" items={data.topReferrers} empty="No referrers yet." />
              <BarList icon={MousePointerClick} title="Top clicks" items={data.topClicks} empty="No clicks yet." />
              <BarList icon={MapPin} title="Top countries" items={data.topCountries} empty="No geo data yet." />
              <BarList icon={MapPin} title="Top cities" items={data.topCities} empty="No geo data yet." />

              {/* Recent known visitors */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-card md:col-span-2 xl:col-span-1">
                <div className="flex items-center gap-2 mb-4">
                  <UserCheck className="w-4 h-4 text-primary" />
                  <h3 className="font-bold font-display text-foreground">Recent known visitors</h3>
                </div>
                {data.recentKnown.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No named visitors yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {data.recentKnown.map((v, i) => (
                      <li key={i} className="text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground truncate pr-2">{v.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">{(() => { try { return format(parseISO(v.when), "MMM d, h:mma"); } catch { return ""; } })()}</span>
                        </div>
                        <div className="text-muted-foreground truncate">{v.email}</div>
                        <div className="text-xs text-muted-foreground truncate">{v.path}{v.place ? ` · ${v.place}` : ""}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            <p className="text-xs text-muted-foreground text-center pt-2">
              Range: {data.range} · {nf.format(t.pageviews)} pageviews · {nf.format(t.clicks)} clicks
            </p>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
