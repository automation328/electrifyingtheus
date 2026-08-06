// CMS activity log — a read-only audit trail of who changed what (editors +
// admins). Data comes from site_activity, written best-effort by /api/admin.

import { useQuery } from "@tanstack/react-query";
import { Loader2, Activity as ActivityIcon, AlertCircle, FilePlus2, FilePen, Trash2, Rocket, EyeOff, UserPlus, UserCog, UserMinus, KeyRound, Bot, Mail } from "lucide-react";
import { listActivity, type ActivityRow } from "@/lib/admin-api";

const TABLE_LABEL: Record<string, string> = {
  site_blog_posts: "blog post", site_events: "event", site_gallery: "gallery item", site_jobs: "job",
  site_vehicles: "vehicle", site_incentives: "incentive", site_pages: "page", site_settings: "site setting",
  kb_source_documents: "knowledge doc",
};

const meta = (a: ActivityRow): { icon: typeof FilePen; label: string; tone: string } => {
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

const targetLabel = (a: ActivityRow) => {
  if (!a.target) return "";
  if (a.action.startsWith("user.")) return a.target;               // an email
  if (a.action === "kb") return a.target;                          // a source slug
  return TABLE_LABEL[a.target] ?? a.target;                        // a table
};

const timeAgo = (iso: string) => {
  const t = new Date(iso).getTime();
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24); if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
};

const ActivityManager = () => {
  const { data: rows = [], isLoading, error } = useQuery({ queryKey: ["admin-activity"], queryFn: listActivity, retry: false });

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold font-display text-foreground mb-1 flex items-center gap-2"><ActivityIcon className="w-6 h-6 text-primary" /> Activity</h1>
      <p className="text-sm text-muted-foreground mb-6">Recent changes across the CMS — who did what, and when.</p>

      {error && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 text-amber-900 px-4 py-3 text-sm mb-4 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>Couldn't load the activity log right now — try refreshing in a moment.</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-16 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">No activity yet.</div>
      ) : (
        <ul className="space-y-1.5">
          {rows.map((a) => {
            const m = meta(a);
            return (
              <li key={a.id} className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-2.5">
                <m.icon className={`w-4 h-4 shrink-0 ${m.tone}`} />
                <div className="min-w-0 flex-1 text-sm">
                  <span className="font-semibold text-foreground">{a.actor}</span>
                  <span className="text-muted-foreground"> {m.label} </span>
                  <span className="text-foreground">{targetLabel(a)}</span>
                  {a.summary && <span className="text-muted-foreground"> · {a.summary}</span>}
                </div>
                <span className="text-xs text-muted-foreground shrink-0" title={new Date(a.created_at).toLocaleString()}>{timeAgo(a.created_at)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ActivityManager;
