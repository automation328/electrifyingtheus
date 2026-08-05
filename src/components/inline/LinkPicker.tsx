// A link field with a "pages" dropdown: type any URL, or pick an internal page
// from a searchable, grouped list (main routes, topic pages, custom pages).
// Used for button/CTA hrefs in the block editor.

import { useMemo, useState } from "react";
import { Link2, ChevronDown, Search, ExternalLink, Hash } from "lucide-react";
import { useSiteLinks, type SiteLink } from "@/lib/site-links";

// Collect on-page jump targets from the currently-rendered blocks (they carry a
// data-block-anchor attribute in the editor).
const collectAnchors = (): SiteLink[] => {
  if (typeof document === "undefined") return [];
  const seen = new Set<string>();
  const out: SiteLink[] = [];
  document.querySelectorAll<HTMLElement>("[data-block-anchor]").forEach((el) => {
    const id = el.getAttribute("data-block-anchor") || "";
    if (!id || seen.has(id)) return;
    seen.add(id);
    const label = (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40) || id;
    out.push({ label, path: `#${id}`, group: "On this page" });
  });
  return out;
};

const LinkPicker = ({ value, onChange, placeholder = "Link (/page or https://…)", className = "" }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) => {
  const siteLinks = useSiteLinks();
  const [open, setOpen] = useState(false);
  const [anchors, setAnchors] = useState<SiteLink[]>([]);
  const [q, setQ] = useState("");
  const links = useMemo(() => [...anchors, ...siteLinks], [anchors, siteLinks]);

  const openMenu = () => { setAnchors(collectAnchors()); setOpen(true); };

  const groups = useMemo(() => {
    const term = q.trim().toLowerCase();
    const filtered = term
      ? links.filter((l) => l.label.toLowerCase().includes(term) || l.path.toLowerCase().includes(term))
      : links;
    const order = ["On this page", "Main", "Topic pages", "Custom pages"];
    const by: Record<string, SiteLink[]> = {};
    for (const l of filtered) (by[l.group] ??= []).push(l);
    return order.filter((g) => by[g]?.length).map((g) => ({ group: g, items: by[g] }));
  }, [links, q]);

  const isExternal = /^https?:\/\//i.test(value);
  const isAnchor = value.startsWith("#");
  const match = links.find((l) => l.path === value);

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-1">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs"
        />
        <button type="button" onClick={() => (open ? setOpen(false) : openMenu())} title="Pick a page" className="shrink-0 inline-flex items-center gap-0.5 rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-muted-foreground hover:bg-muted">
          <Link2 className="w-3.5 h-3.5" /> <ChevronDown className="w-3 h-3" />
        </button>
      </div>
      {value && (
        <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground truncate">
          {isExternal ? <ExternalLink className="w-3 h-3 shrink-0" /> : isAnchor ? <Hash className="w-3 h-3 shrink-0" /> : <Link2 className="w-3 h-3 shrink-0" />}
          <span className="truncate">{match ? `→ ${match.label}` : isExternal ? "External link" : isAnchor ? "Jump to section on this page" : value}</span>
        </div>
      )}
      {open && (
        <>
          <div className="fixed inset-0 z-[95]" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full mt-1 z-[96] w-72 max-h-72 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-2 shadow-2xl ring-1 ring-black/5">
            <div className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1 mb-1.5 sticky top-0">
              <Search className="w-3.5 h-3.5 text-neutral-400" />
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pages…" className="w-full bg-transparent text-xs outline-none" />
            </div>
            {groups.length === 0 && <div className="px-2 py-3 text-xs text-neutral-400 text-center">No pages match.</div>}
            {groups.map((g) => (
              <div key={g.group} className="mb-1">
                <div className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neutral-400">{g.group}</div>
                {g.items.map((l) => (
                  <button
                    key={l.path}
                    onClick={() => { onChange(l.path); setOpen(false); setQ(""); }}
                    className={`w-full text-left rounded-lg px-2 py-1.5 hover:bg-primary/5 ${value === l.path ? "bg-primary/10" : ""}`}
                  >
                    <div className="text-xs font-medium text-neutral-800 truncate">{l.label}</div>
                    <div className="text-[10px] text-neutral-400 truncate">{l.path}</div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LinkPicker;
