import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True when both Supabase env vars are present, so the UI can degrade gracefully. */
export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = isSupabaseConfigured ? createClient(url!, anonKey!) : null;

export interface Blog {
  id: string;
  title: string;
  excerpt: string | null;
  content: string;
  author_id: string;
  author_name: string | null;
  created_at: string;
  updated_at: string;
}
