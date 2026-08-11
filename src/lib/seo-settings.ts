// Reads the site-wide SEO settings row (site_settings key = 'seo') and layers it
// over the code defaults. Mirrors src/lib/theme-settings.ts.
//
// Always merged FIELD BY FIELD over SEO_DEFAULT: a row saved with only some
// fields filled must not blank the rest.

import { useQuery } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { SEO_DEFAULT, type SeoSettings } from "@/data/seo";

export async function fetchSeo(): Promise<Partial<SeoSettings> | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("site_settings").select("value").eq("key", "seo").maybeSingle();
  if (error || !data) return null;
  return (data.value ?? null) as Partial<SeoSettings> | null;
}

/** Merge a stored row over the defaults, dropping empty strings so a blank field
 *  in the CMS falls back to the default rather than emptying the tag. */
export function mergeSeo(row: Partial<SeoSettings> | null | undefined): SeoSettings {
  const out: SeoSettings = { ...SEO_DEFAULT };
  if (!row) return out;
  for (const k of Object.keys(SEO_DEFAULT) as (keyof SeoSettings)[]) {
    const v = row[k];
    if (typeof v === "string" && v.trim() !== "") out[k] = v.trim();
  }
  return out;
}

/** Site-wide SEO settings, always fully populated. */
export function useSeoSettings(): SeoSettings {
  const q = useQuery({
    queryKey: ["site-setting", "seo"],
    queryFn: fetchSeo,
    enabled: isSupabaseConfigured,
    staleTime: 5 * 60 * 1000,
  });
  return mergeSeo(q.data);
}
