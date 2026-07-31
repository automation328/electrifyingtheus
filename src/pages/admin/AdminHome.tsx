// CMS overview — quick links into each content section, with live row counts for
// the DB-backed collections.

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Newspaper, CalendarDays, Images, Briefcase, FileText, Car, BadgePercent, Bot, ArrowRight,
} from "lucide-react";
import { listRows, type AdminTable } from "@/lib/admin-api";

interface Card {
  to: string; label: string; icon: typeof Newspaper; desc: string;
  table?: AdminTable; soon?: boolean;
}

const CARDS: Card[] = [
  { to: "/admin/content/blog", label: "Blog posts", icon: Newspaper, desc: "News & articles", table: "site_blog_posts" },
  { to: "/admin/content/events", label: "Events", icon: CalendarDays, desc: "Ride & drives, webinars, expos", table: "site_events" },
  { to: "/admin/content/gallery", label: "Gallery", icon: Images, desc: "Photos & videos", table: "site_gallery" },
  { to: "/admin/content/jobs", label: "Jobs", icon: Briefcase, desc: "Careers board", table: "site_jobs" },
  { to: "/admin/content/vehicles", label: "Vehicles", icon: Car, desc: "Calculator catalog", table: "site_vehicles" },
  { to: "/admin/content/incentives", label: "Incentives", icon: BadgePercent, desc: "Rebates & credits", table: "site_incentives" },
  { to: "/admin/content/pages", label: "Pages", icon: FileText, desc: "Content page copy" },
  { to: "/admin/content/knowledge-base", label: "EVan knowledge", icon: Bot, desc: "Assistant RAG documents", soon: true },
];

function useCounts() {
  return useQuery({
    queryKey: ["admin-counts"],
    queryFn: async () => {
      const tables: AdminTable[] = ["site_blog_posts", "site_events", "site_gallery", "site_jobs", "site_vehicles", "site_incentives"];
      const entries = await Promise.all(
        tables.map(async (t) => {
          try { return [t, (await listRows(t)).length] as const; }
          catch { return [t, null] as const; }
        }),
      );
      return Object.fromEntries(entries) as Record<AdminTable, number | null>;
    },
    staleTime: 60_000,
  });
}

const AdminHome = () => {
  const { data: counts } = useCounts();

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold font-display text-foreground mb-1">Content editor</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Edit what visitors see. Published changes go live on the site; drafts stay hidden until you publish.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        {CARDS.map((c) => {
          const count = c.table && counts ? counts[c.table] : undefined;
          return (
            <Link
              key={c.to}
              to={c.to}
              className="group rounded-2xl border border-border bg-card p-5 shadow-card hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted grid place-items-center text-primary shrink-0">
                  <c.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold font-display text-foreground">{c.label}</h3>
                    {c.soon && (
                      <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground border border-border rounded-full px-1.5 py-0.5">
                        soon
                      </span>
                    )}
                    <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{c.desc}</p>
                  {typeof count === "number" && (
                    <p className="text-xs text-muted-foreground mt-2">{count} item{count === 1 ? "" : "s"}</p>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default AdminHome;
