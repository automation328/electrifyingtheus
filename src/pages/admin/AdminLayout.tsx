// CMS shell — sidebar navigation + routed content area. Wrapped by RequireEditor,
// so anything rendered here is for an authorized editor.

import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Newspaper, CalendarDays, Images, Briefcase,
  FileText, Car, BadgePercent, Bot, LogOut, ExternalLink, Zap, FolderOpen, Menu, PanelBottom, Palette,
} from "lucide-react";
import { signOut, useEditorAuth } from "@/lib/auth";

interface NavItem { to: string; label: string; icon: typeof Newspaper; end?: boolean }

const NAV: NavItem[] = [
  { to: "/admin/content", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/content/blog", label: "Blog posts", icon: Newspaper },
  { to: "/admin/content/events", label: "Events", icon: CalendarDays },
  { to: "/admin/content/gallery", label: "Gallery", icon: Images },
  { to: "/admin/content/jobs", label: "Jobs", icon: Briefcase },
  { to: "/admin/content/media", label: "Media", icon: FolderOpen },
  { to: "/admin/content/pages", label: "Pages", icon: FileText },
  { to: "/admin/content/navigation", label: "Navigation", icon: Menu },
  { to: "/admin/content/footer", label: "Footer", icon: PanelBottom },
  { to: "/admin/content/theme", label: "Theme", icon: Palette },
  { to: "/admin/content/vehicles", label: "Vehicles", icon: Car },
  { to: "/admin/content/incentives", label: "Incentives", icon: BadgePercent },
  { to: "/admin/content/knowledge-base", label: "EVan knowledge", icon: Bot },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const auth = useEditorAuth();

  const doSignOut = async () => {
    await signOut();
    navigate("/admin/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-border bg-card hidden md:flex flex-col sticky top-0 h-screen">
        <div className="flex items-center gap-2 px-5 h-16 border-b border-border">
          <div className="w-8 h-8 rounded-lg gradient-hero grid place-items-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div className="leading-none">
            <div className="font-bold font-display text-foreground text-sm">Content editor</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">Electrifying the US</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "gradient-hero text-white shadow-card"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-3 space-y-1">
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ExternalLink className="w-4 h-4 shrink-0" /> View site
          </a>
          <button
            onClick={doSignOut}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" /> Sign out
          </button>
          {auth.status === "editor" && (
            <p className="px-3 pt-1 text-[11px] text-muted-foreground truncate" title={auth.editor.email}>
              {auth.editor.email}{auth.editor.role === "admin" ? " · admin" : ""}
            </p>
          )}
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="md:hidden sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur flex items-center gap-2 px-4 h-14">
          <div className="w-7 h-7 rounded-lg gradient-hero grid place-items-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold font-display text-foreground text-sm mr-auto">Content editor</span>
          <button onClick={doSignOut} className="p-2 rounded-lg text-muted-foreground hover:bg-muted" title="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        {/* Mobile nav — horizontal scroll */}
        <nav className="md:hidden flex gap-1 overflow-x-auto border-b border-border bg-card px-3 py-2">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive ? "gradient-hero text-white" : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              <item.icon className="w-3.5 h-3.5 shrink-0" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 min-w-0 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
