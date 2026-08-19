// The set of internal destinations an editor can link a button/CTA to, so links
// are chosen from a list instead of typed by hand. Combines the main coded
// routes, the editable topic pages, and any published custom CMS pages.

import { useQuery } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { cmsError } from "@/lib/cms-error";
import { EDITABLE_PAGES } from "@/lib/page-content";

export interface SiteLink { label: string; path: string; group: string }

const CORE_LINKS: SiteLink[] = [
  { label: "Home", path: "/", group: "Main" },
  { label: "EV vs Gas Calculator", path: "/electricity-vs-gasoline", group: "Main" },
  { label: "GM EV vs Gas", path: "/gm-ev-vs-gas", group: "Main" },
  { label: "Find a Charger", path: "/find-a-charger", group: "Main" },
  { label: "Rebates & Incentives", path: "/rebates-incentives", group: "Main" },
  { label: "Rebate Eligibility Check", path: "/rebate-eligibility", group: "Main" },
  { label: "EVan Assistant", path: "/assistant", group: "Main" },
  { label: "News", path: "/news", group: "Main" },
  { label: "Events", path: "/events", group: "Main" },
  { label: "Gallery", path: "/gallery", group: "Main" },
  { label: "Careers", path: "/careers", group: "Main" },
  { label: "Contact", path: "/contact-us", group: "Main" },
];

const TOPIC_LINKS: SiteLink[] = EDITABLE_PAGES.map((p) => ({ label: p.label, path: p.path, group: "Topic pages" }));

export const STATIC_SITE_LINKS: SiteLink[] = [...CORE_LINKS, ...TOPIC_LINKS];

/** All internal links, including published custom CMS pages. */
export function useSiteLinks(): SiteLink[] {
  const { data } = useQuery({
    queryKey: ["site-links-custom"],
    queryFn: async (): Promise<SiteLink[]> => {
      if (!supabase) return [];
      const { data, error } = await supabase.from("site_pages").select("path,title").eq("status", "published");
      if (error) throw cmsError("site_pages", error);
      if (!data) return [];
      return (data as { path: string; title?: string }[]).map((r) => ({ label: r.title || r.path, path: r.path, group: "Custom pages" }));
    },
    enabled: isSupabaseConfigured,
    staleTime: 5 * 60 * 1000,
  });
  const custom = (data ?? []).filter((c) => !STATIC_SITE_LINKS.some((s) => s.path === c.path));
  return [...STATIC_SITE_LINKS, ...custom];
}
