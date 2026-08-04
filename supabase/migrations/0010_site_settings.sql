-- Key/value store for small site-wide settings the CMS can edit (e.g. the top
-- navigation menu). Public-readable (these drive the public site); the CMS writes
-- with the service role key via /api/admin.
--
-- Run in Supabase → SQL Editor (or `supabase db push`).

create table if not exists public.site_settings (
  id         uuid        primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  key        text        not null unique,     -- e.g. 'nav'
  value      jsonb       not null default '{}'::jsonb
);

alter table public.site_settings enable row level security;

drop policy if exists "public read settings" on public.site_settings;
create policy "public read settings"
  on public.site_settings for select
  using (true);
