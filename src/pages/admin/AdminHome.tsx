// CMS overview — the editor's landing dashboard: at-a-glance totals, quick
// actions, per-section cards with live counts (published / draft), and a recent
// activity feed (admin/editor). Counts come from the admin list API.

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Newspaper, CalendarDays, Images, Briefcase, FileText, Car, BadgePercent, Bot,
  ArrowRight, Layers, Rocket, PenLine, FolderOpen, BarChart3, ExternalLink,
  Activity as ActivityIcon, FilePlus2, FilePen, Trash2, EyeOff, UserPlus, UserCog,
  UserMinus, KeyRound, Mail,
} from "lucide-react";
import { listRows, listMedia, listActivity, type AdminTable, type ActivityRow } from "@/lib/admin-api";
import { useEditorAuth } from "@/lib/auth";

interface Card {
  to: string; label: string; icon: typeof Newspaper; desc: string; table?: AdminTable;
}

const CARDS: Card[] = [
  { to: "/admin/content/blog", label: "Blog posts", icon: Newspaper, desc: "News & articles", table: "site_blog_posts" },
  { to: "/admin/content/events", label: "Events", icon: CalendarDays, desc: "Ride & drives, webinars, expos", table: "site_events" },
  { to: "/admin/content/gallery", label: "Gallery", icon: Images, desc: "Photos & videos", table: "site_gallery" },
  { to: "/admin/content/jobs", label: "Jobs", icon: Briefcase, desc: "Careers board", table: "site_jobs" },
  { to: "/admin/content/vehicles", label: "Vehicles", icon: Car, desc: "Calculator catalog", table: "site_vehicles" },
  { to: "/admin/content/incentives", label: "Incentives", icon: BadgePercent, desc: "Rebates & credits", table: "site_incentives" },
  { to: "/admin/content/pages", label: "Pages", icon: FileText, desc: "Content page copy" },
  { to: "/admin/content/knowledge-base", label: "EVan knowledge", icon: Bot, desc: "Assistant RAG documents", table: "kb_source_documents" },
];

const CONTENT_TABLES: AdminTable[] = ["site_blog_posts", "site_events", "site_gallery", "site_jobs", "site_vehicles", "site_incentives"];

interface TableStat { total: number; published: number; draft: number }

// One pass over the admin list API: per-table totals + published/draft split,
// plus media + KB counts. Each source fails independently (null) so one broken
// table doesn't blank the whole dashboard.
function useDashboard() {
  return useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const perTable: Partial<Record<AdminTable, TableStat | null>> = {};
      let total = 0, published = 0, draft = 0;
      await Promise.all(
        CONTENT_TABLES.map(async (t) => {
          try {
            const rows = await listRows<Record<string, unknown>>(t);
            const pub = rows.filter((r) => String(r.status ?? "") === "published").length;
            const drf = rows.filter((r) => String(r.status ?? "") === "draft").length;
            perTable[t] = { total: rows.length, published: pub, draft: drf };
            total += rows.length; published += pub; draft += drf;
          } catch { perTable[t] = null; }
        }),
      );
      let kb: number | null = null;
      try { kb = (await listRows("kb_source_documents")).length; } catch { kb = null; }
      let media: number | null = null;
      try { media = (await listMedia()).length; } catch { media = null; }
      return { perTable, total, published, draft, kb, media };
    },
    staleTime: 60_000,
  });
}

const TABLE_LABEL: Record<string, string> = {
  site_blog_posts: "blog post", site_events: "event", site_gallery: "gallery item", site_jobs: "job",
  site_vehicles: "vehicle", site_incentives: "incentive", site_pages: "page", site_settings: "site setting",
  kb_source_documents: "knowledge doc",
};

const actionMeta = (a: ActivityRow): { icon: typeof FilePen; label: string; tone: string } => {
  switch (a.action) {
    case "insert": return { icon: FilePlus2, label: "created", tone: "text-primary" };
    case "update": return { icon: FilePen, label: "edited", tone: "text-foreground" };
    case "delete": return { icon: Trash2, label: "deleted", tone: "text-destructive" };
    case "publish": return { icon: Rocket, label: "published", tone: "text-primary" };
    case "unpublish": return { icon: EyeOff, label: "unpublished", tone: "text-amber-600" };
    case "user.add": return { icon: UserPlus, label: "added user", tone: "text-primary" };
    case "user.role": return { icon: UserCog, label: "changed role of", tone: "text-foreground" };
    case "user.remove": return { icon: UserMinus, label: "removed user", tone: "text-destructive" };
    case "user.password": return { icon: KeyRound, label: "reset password for", tone: "text-foreground" };
    case "user.invite": return { icon: Mail, label: "invited", tone: "text-foreground" };
    case "kb": return { icon: Bot, label: "updated knowledge", tone: "text-foreground" };
    default: return { icon: FilePen, label: a.action, tone: "text-foreground" };
  }
};

const activityTarget = (a: ActivityRow) => {
  if (!a.target) return "";
  if (a.action.startsWith("user.") || a.action === "kb") return a.target;
  return TABLE_LABEL[a.target] ?? a.target;
};

const timeAgo = (iso: string) => {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24); if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
};

const Kpi = ({ icon: Icon, label, value, hint }: { icon: typeof Layers; label: string; value: number | null | undefined; hint: string }) => (
  <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
    <div className="flex items-center gap-2.5 mb-3">
      <span className="w-9 h-9 rounded-xl gradient-hero grid place-items-center shrink-0">
        <Icon className="w-4.5 h-4.5 text-white" />
      </span>
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
    </div>
    <div className="text-3xl font-bold font-display text-foreground tabular-nums">
      {typeof value === "number" ? value : <span className="text-muted-foreground/40">—</span>}
    </div>
    <div className="text-xs text-muted-foreground mt-1">{hint}</div>
  </div>
);

const AdminHome = () => {
  const auth = useEditorAuth();
  const role = auth.status === "editor" ? auth.editor.role : "viewer";
  const email = auth.status === "editor" ? auth.editor.email : "";
  const canViewActivity = role === "admin" || role === "editor";

  const { data: d } = useDashboard();
  const { data: activity = [] } = useQuery({
    queryKey: ["admin-activity", "home"],
    queryFn: listActivity,
    enabled: canViewActivity,
    retry: false,
    staleTime: 30_000,
  });
  const recent = activity.slice(0, 6);

  const kpis = [
    { label: "Content items", value: d?.total, icon: Layers, hint: "across all collections" },
    { label: "Published", value: d?.published, icon: Rocket, hint: "live on the site" },
    { label: "Drafts", value: d?.draft, icon: PenLine, hint: "not yet published" },
    { label: "Media", value: d?.media ?? undefined, icon: FolderOpen, hint: "images, video & audio" },
  ];

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex flex-wrap items-start gap-4 mb-7">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold font-display text-foreground">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {email ? <>Signed in as <span className="text-foreground font-medium">{email}</span> · {role}. </> : null}
            Published changes go live on the site; drafts stay hidden until you publish.
          </p>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          {canViewActivity && (
            <Link to="/admin/content/statistics" className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2 text-sm font-semibold text-foreground hover:border-primary/40 hover:bg-muted transition-colors">
              <BarChart3 className="w-4 h-4 text-primary" /> Statistics
            </Link>
          )}
          <a href="/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl gradient-hero text-white px-3.5 py-2 text-sm font-semibold hover:opacity-90 transition-opacity">
            <ExternalLink className="w-4 h-4" /> View site
          </a>
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        {kpis.map((k) => <Kpi key={k.label} {...k} />)}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 items-start">
        {/* Section cards */}
        <div className="lg:col-span-2">
          <h2 className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground/70 mb-3">Manage content</h2>
          <div className="grid sm:grid-cols-2 gap-3.5">
            {CARDS.map((c) => {
              const stat = c.table && d?.perTable ? d.perTable[c.table] : undefined;
              const count = c.table === "kb_source_documents" ? d?.kb : stat?.total;
              return (
                <Link
                  key={c.to}
                  to={c.to}
                  className="group rounded-2xl border border-border/70 bg-card p-4 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-hero grid place-items-center text-white shrink-0">
                      <c.icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold font-display text-foreground">{c.label}</h3>
                        {typeof count === "number" && (
                          <span className="text-[11px] font-semibold text-muted-foreground bg-muted rounded-full px-2 py-0.5 tabular-nums">{count}</span>
                        )}
                        <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">{c.desc}</p>
                      {stat && (stat.published > 0 || stat.draft > 0) && (
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                          {stat.published > 0 && <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-primary" />{stat.published} published</span>}
                          {stat.draft > 0 && <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" />{stat.draft} draft{stat.draft === 1 ? "" : "s"}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent activity */}
        {canViewActivity && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground/70">Recent activity</h2>
              <Link to="/admin/content/activity" className="text-[11px] font-semibold text-primary hover:underline ml-auto">View all</Link>
            </div>
            <div className="rounded-2xl border border-border bg-card p-2 shadow-card">
              {recent.length === 0 ? (
                <div className="flex items-center gap-2 px-3 py-6 text-sm text-muted-foreground justify-center">
                  <ActivityIcon className="w-4 h-4" /> No activity yet
                </div>
              ) : (
                <ul className="divide-y divide-border/60">
                  {recent.map((a) => {
                    const m = actionMeta(a);
                    return (
                      <li key={a.id} className="flex items-start gap-2.5 px-2.5 py-2.5">
                        <m.icon className={`w-4 h-4 mt-0.5 shrink-0 ${m.tone}`} />
                        <div className="min-w-0 flex-1 text-[13px] leading-snug">
                          <span className="font-semibold text-foreground">{a.actor.split("@")[0]}</span>
                          <span className="text-muted-foreground"> {m.label} </span>
                          <span className="text-foreground">{activityTarget(a)}</span>
                          <div className="text-[11px] text-muted-foreground mt-0.5" title={new Date(a.created_at).toLocaleString()}>{timeAgo(a.created_at)}</div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminHome;
