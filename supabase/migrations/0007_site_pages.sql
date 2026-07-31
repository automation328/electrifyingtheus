-- CMS overrides for content-page copy (the ContentPageLayout pages).
--
-- Each row overrides the editable prose of one page, keyed by its route path. The
-- payload in `content` (JSON) holds any subset of the editable fields — badge,
-- title, highlight, intro, kicker, pullQuote, stats[], sections[], sources[].
-- Fields absent from the payload fall back to the page's static default, so an
-- editor can tweak just a headline without restating the whole page.
--
-- The site reads the PUBLISHED row for a path (anon, RLS); the CMS writes with
-- the service role key. Non-text structure (icon, hero image, video, galleries)
-- stays in code and is not overridable here.
--
-- Run in Supabase → SQL Editor (or `supabase db push`).

create table if not exists public.site_pages (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status     text        not null default 'draft',   -- draft | published
  path       text        not null unique,             -- route path, e.g. /reduced-emissions
  title      text        not null default '',         -- admin-facing label
  content    jsonb       not null default '{}'::jsonb  -- override payload (see above)
);

alter table public.site_pages enable row level security;

drop policy if exists "public read published pages" on public.site_pages;
create policy "public read published pages"
  on public.site_pages for select
  using (status = 'published');
