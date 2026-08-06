// Presentational analytics dashboard — KPIs, traffic chart, per-page + per-visitor
// panels, breakdown lists, and the per-visitor journey drill-down modal.
//
// Purely visual + self-contained journey state; it does NOT fetch. The parent owns
// data fetching + range state and passes `fetchJourney` for the drill-down. Shared
// by the password-gated /admin dashboard (AdminDashboard) and the editor-gated
// Statistics view embedded in the CMS (StatisticsManager) so the two never drift.

import { useEffect, useState } from "react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Activity, MousePointerClick, Users, UserCheck, Eye, Sparkles, RefreshCw,
  MapPin, Link2, FileText, TrendingUp, ChevronRight, X, Clock, MousePointer,
  FileText as FileIcon,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import type {
  AnalyticsData, AnalyticsBar, AnalyticsPageRow, AnalyticsVisitorRow, AnalyticsJourney,
} from "@/lib/admin-api";

export const RANGES = [
  { key: "24h", label: "24h" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "90d", label: "90 days" },
];

const nf = new Intl.NumberFormat("en-US");

const visitorLabel = (v: { name: string | null; email: string | null; visitorId: string }) =>
  v.name || v.email || `Anonymous · ${v.visitorId.slice(0, 8)}`;
const fmtTime = (iso: string, withDate = false) => {
  try { return format(parseISO(iso), withDate ? "MMM d, h:mma" : "h:mm:ss a"); } catch { return ""; }
};

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

const BarList = ({ icon: Icon, title, items, empty }: { icon: typeof Eye; title: string; items: AnalyticsBar[]; empty: string }) => {
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

const PagesPanel = ({ pages, totalViews }: { pages: AnalyticsPageRow[]; totalViews: number }) => {
  const max = Math.max(1, ...pages.map((p) => p.count));
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center gap-2 mb-1">
        <FileText className="w-4 h-4 text-primary" />
        <h3 className="font-bold font-display text-foreground">Page views</h3>
        <span className="text-xs text-muted-foreground ml-1">views &amp; unique visitors per page</span>
        <span className="ml-auto text-xs text-muted-foreground">{nf.format(pages.length)} pages</span>
      </div>
      {pages.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4">No pageviews yet.</p>
      ) : (
        <ul className="mt-3 space-y-3 max-h-[460px] overflow-y-auto pr-1">
          {pages.map((p) => {
            const pct = totalViews > 0 ? Math.round((p.count / totalViews) * 100) : 0;
            return (
              <li key={p.key}>
                <div className="flex items-baseline justify-between gap-3 text-sm mb-1">
                  <span className="text-foreground truncate font-medium" title={p.key}>{p.key}</span>
                  <span className="text-muted-foreground shrink-0 tabular-nums">
                    <span className="text-foreground font-semibold">{nf.format(p.count)}</span> view{p.count === 1 ? "" : "s"}
                    <span className="mx-1.5 text-border">·</span>
                    {nf.format(p.visitors)} visitor{p.visitors === 1 ? "" : "s"}
                    <span className="ml-2 text-xs text-muted-foreground">{pct}%</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full gradient-hero" style={{ width: `${(p.count / max) * 100}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

const VisitorsPanel = ({ visitors, onSelect }: { visitors: AnalyticsVisitorRow[]; onSelect: (v: AnalyticsVisitorRow) => void }) => (
  <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
    <div className="flex items-center gap-2 mb-1">
      <Users className="w-4 h-4 text-primary" />
      <h3 className="font-bold font-display text-foreground">Visitors</h3>
      <span className="text-xs text-muted-foreground ml-1 hidden sm:inline">click a visitor to see every page they viewed</span>
      <span className="ml-auto text-xs text-muted-foreground">{nf.format(visitors.length)}</span>
    </div>
    {visitors.length === 0 ? (
      <p className="text-sm text-muted-foreground py-4">No visitors in this range yet.</p>
    ) : (
      <ul className="mt-2 max-h-[480px] overflow-y-auto divide-y divide-border">
        {visitors.map((v) => (
          <li key={v.visitorId}>
            <button
              onClick={() => onSelect(v)}
              className="w-full text-left py-2.5 px-2 -mx-2 rounded-lg flex items-center gap-3 hover:bg-muted/60 transition-colors"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${v.isKnown ? "gradient-hero text-white" : "bg-muted text-muted-foreground"}`}>
                {(v.name?.[0] || v.email?.[0] || "?").toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold text-foreground truncate">{visitorLabel(v)}</span>
                  {v.isKnown && v.name && v.email && (
                    <span className="text-xs text-muted-foreground truncate hidden sm:inline">{v.email}</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {nf.format(v.views)} view{v.views === 1 ? "" : "s"} · {nf.format(v.sessions)} session{v.sessions === 1 ? "" : "s"} · last on {v.lastPage}{v.place ? ` · ${v.place}` : ""}
                </div>
              </div>
              <span className="text-xs text-muted-foreground shrink-0 hidden md:block">{fmtTime(v.lastSeen, true)}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          </li>
        ))}
      </ul>
    )}
  </div>
);

const JourneyModal = ({ journey, loading, onClose }: { journey: AnalyticsJourney | null; loading: boolean; onClose: () => void }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const v = journey?.visitor;
  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-3 md:p-6 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-card rounded-2xl border border-border shadow-elevated w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start gap-3 p-5 border-b border-border">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${v?.isKnown ? "gradient-hero text-white" : "bg-muted text-muted-foreground"}`}>
            {(v?.name?.[0] || v?.email?.[0] || "?").toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold font-display text-lg text-foreground truncate">{v ? visitorLabel(v) : "Visitor"}</h2>
            <p className="text-sm text-muted-foreground truncate">
              {v?.email && v?.name ? `${v.email} · ` : ""}{v?.place || "Unknown location"}
            </p>
            {v && (
              <p className="text-xs text-muted-foreground mt-1">
                {nf.format(v.views)} views · {nf.format(v.clicks)} clicks · {nf.format(v.sessions)} session{v.sessions === 1 ? "" : "s"}
                {v.firstSeen ? ` · first seen ${fmtTime(v.firstSeen, true)}` : ""}
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-muted-foreground hover:bg-muted transition-colors shrink-0" title="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-5">
          {loading && <div className="py-12 text-center text-muted-foreground text-sm">Loading journey…</div>}
          {!loading && journey && journey.sessions.length === 0 && (
            <div className="py-12 text-center text-muted-foreground text-sm">No activity recorded in the last 90 days.</div>
          )}
          {!loading && journey && journey.sessions.map((s, si) => (
            <div key={s.sessionId + si} className="mb-6 last:mb-0">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-foreground">Session {journey.sessions.length - si}</span>
                <span className="text-xs text-muted-foreground">· {fmtTime(s.start, true)}</span>
                <span className="text-xs text-muted-foreground ml-auto">{s.events.length} event{s.events.length === 1 ? "" : "s"}</span>
              </div>
              <ol className="relative border-l border-border ml-1.5 space-y-0.5">
                {s.events.map((e, i) => {
                  const click = e.type === "click";
                  return (
                    <li key={i} className="relative pl-5 py-1.5">
                      <span className={`absolute -left-[5px] top-2.5 w-2.5 h-2.5 rounded-full ${click ? "bg-secondary" : "bg-primary"}`} />
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-sm truncate flex items-center gap-1.5">
                          {click
                            ? <span className="text-muted-foreground flex items-center gap-1.5"><MousePointer className="w-3 h-3 shrink-0" />Clicked: <span className="text-foreground">{e.label}</span></span>
                            : <span className="text-foreground flex items-center gap-1.5"><FileIcon className="w-3 h-3 shrink-0 text-primary" />{e.path}</span>}
                        </span>
                        <span className="text-xs text-muted-foreground shrink-0 tabular-nums">{fmtTime(e.when)}</span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── The view ────────────────────────────────────────────────────────────── */

interface Props {
  data: AnalyticsData | null;
  loading: boolean;
  error: string;
  range: string;
  onRange: (r: string) => void;
  onRefresh: () => void;
  fetchJourney: (visitorId: string) => Promise<AnalyticsJourney | null>;
}

const AnalyticsView = ({ data, loading, error, range, onRange, onRefresh, fetchJourney }: Props) => {
  const [journey, setJourney] = useState<AnalyticsJourney | null>(null);
  const [journeyLoading, setJourneyLoading] = useState(false);
  const [journeyOpen, setJourneyOpen] = useState(false);

  const openVisitor = async (v: AnalyticsVisitorRow) => {
    setJourneyOpen(true); setJourneyLoading(true); setJourney(null);
    // Guard against a rejecting fetchJourney (network error / non-JSON body) so the
    // modal can never get stuck on the loading spinner — always clear loading.
    try {
      setJourney(await fetchJourney(v.visitorId));
    } catch {
      setJourney(null);
    } finally {
      setJourneyLoading(false);
    }
  };

  const t = data?.totals;

  return (
    <div className="space-y-6">
      {/* Toolbar — range + refresh */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => onRange(r.key)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                range === r.key ? "gradient-hero text-white font-semibold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <button onClick={onRefresh} className="p-2 rounded-full border border-border bg-card text-muted-foreground hover:text-foreground transition-colors" title="Refresh">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

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

          {/* Per-page views */}
          <section>
            <PagesPanel pages={data.pages} totalViews={t.pageviews} />
          </section>

          {/* Visitors — drill into one person's page-by-page journey */}
          <section>
            <VisitorsPanel visitors={data.visitors} onSelect={openVisitor} />
          </section>

          {/* Breakdown grid */}
          <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
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

      {journeyOpen && (
        <JourneyModal
          journey={journey}
          loading={journeyLoading}
          onClose={() => { setJourneyOpen(false); setJourney(null); }}
        />
      )}
    </div>
  );
};

export default AnalyticsView;
