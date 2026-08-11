// Reusable block templates — an editor saves a styled block once and drops it
// onto any page. Stored in site_settings (key='block-templates'), publicly
// readable so the palette can list them.

import { useQuery } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { cmsError } from "@/lib/cms-error";
import type { PageBlock } from "@/lib/page-content";

export interface BlockTemplate { id: string; name: string; block: PageBlock }

export async function fetchTemplates(): Promise<BlockTemplate[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("site_settings").select("value").eq("key", "block-templates").maybeSingle();
  if (error) throw cmsError("site_settings:block-templates", error);
  if (!data) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (data.value as any)?.items;
  return Array.isArray(items) ? (items as BlockTemplate[]) : [];
}

export function useBlockTemplates(): BlockTemplate[] {
  const q = useQuery({
    queryKey: ["site-setting", "block-templates"],
    queryFn: fetchTemplates,
    enabled: isSupabaseConfigured,
    staleTime: 60_000,
  });
  return q.data ?? [];
}
