-- First-party site analytics: pageviews + clicks, written by the /api/track
-- serverless function and read by the password-gated /api/analytics function.
--
-- Both functions use the SERVICE ROLE key (server-only env on Vercel), which
-- bypasses RLS. RLS is enabled with NO anon policies, so the public anon key can
-- neither read nor write this table — analytics data is never exposed client-side.
--
-- Run in Supabase → SQL Editor (or `supabase db push`).

create table if not exists public.site_analytics (
  id          uuid        primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  type        text        not null default 'pageview',  -- pageview | click
  path        text        not null default '',          -- pathname + search
  referrer    text        not null default '',
  label       text,                                       -- click target / CTA label
  session_id  text,                                       -- per-tab session (sessionStorage)
  visitor_id  text,                                       -- persistent device id (localStorage)
  first_name  text,                                       -- from leadIdentity, if known
  email       text,                                       -- from leadIdentity, if known
  is_known    boolean     not null default false,         -- visitor has a saved identity
  ip          text,
  city        text,
  region      text,
  country     text,
  user_agent  text
);

create index if not exists site_analytics_created_idx on public.site_analytics (created_at desc);
create index if not exists site_analytics_type_idx    on public.site_analytics (type);
create index if not exists site_analytics_visitor_idx on public.site_analytics (visitor_id);

-- RLS on, no anon policies → only the service role (server functions) can touch it.
alter table public.site_analytics enable row level security;
