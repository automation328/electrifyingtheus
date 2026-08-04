// Reads CMS-editable site settings (currently the top navigation menu) with a
// graceful fall back to the coded defaults. Public read of the site_settings
// table; the CMS writes via the admin API.

import { useQuery } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { NAV_DEFAULT, type NavItem } from "@/data/nav";
import { FOOTER_DEFAULT, type FooterContent } from "@/data/footer";

async function fetchSetting<T>(key: string): Promise<T | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("site_settings").select("value").eq("key", key).maybeSingle();
  if (error || !data) return null;
  return (data.value ?? null) as T | null;
}

/** Reactive nav items — the saved override, else the coded default. */
export function useNavItems(): NavItem[] {
  const q = useQuery({
    queryKey: ["site-setting", "nav"],
    queryFn: () => fetchSetting<{ items: NavItem[] }>("nav"),
    enabled: isSupabaseConfigured,
    staleTime: 5 * 60 * 1000,
  });
  const items = q.data?.items;
  return Array.isArray(items) && items.length ? items : NAV_DEFAULT;
}

/** Reactive footer content — the saved override merged over the coded default. */
export function useFooter(): FooterContent {
  const q = useQuery({
    queryKey: ["site-setting", "footer"],
    queryFn: () => fetchSetting<Partial<FooterContent>>("footer"),
    enabled: isSupabaseConfigured,
    staleTime: 5 * 60 * 1000,
  });
  const v = q.data;
  if (!v) return FOOTER_DEFAULT;
  return {
    tagline: v.tagline ?? FOOTER_DEFAULT.tagline,
    email: v.email ?? FOOTER_DEFAULT.email,
    columns: Array.isArray(v.columns) && v.columns.length ? v.columns : FOOTER_DEFAULT.columns,
    newsletterTitle: v.newsletterTitle ?? FOOTER_DEFAULT.newsletterTitle,
    newsletterText: v.newsletterText ?? FOOTER_DEFAULT.newsletterText,
    bottomLinks: Array.isArray(v.bottomLinks) && v.bottomLinks.length ? v.bottomLinks : FOOTER_DEFAULT.bottomLinks,
  };
}
