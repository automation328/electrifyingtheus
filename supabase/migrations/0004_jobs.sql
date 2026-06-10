-- Jobs posted via the n8n job form. Shown on /careers ABOVE the external ATS
-- listings. Site reads published rows (anon, RLS); n8n writes with service_role.

create table if not exists public.site_jobs (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  status           text        not null default 'published',  -- published | archived
  title            text        not null,
  company          text        not null default 'Electrifying the US',
  department       text        not null default 'EV Industry',
  location         text        not null default '',
  type             text        not null default 'Full-time',    -- Full-time, Contract…
  description      text        not null default '',             -- short preview
  description_full text,                                         -- full body (shown when expanded)
  image            text,                                         -- optional card image URL
  apply_url        text,                                         -- where Apply routes
  apply_email      text,
  featured         boolean     not null default false,
  sort             int         not null default 0
);

create index if not exists site_jobs_sort_idx on public.site_jobs (sort, created_at desc);

alter table public.site_jobs enable row level security;

drop policy if exists "public read published jobs" on public.site_jobs;
create policy "public read published jobs"
  on public.site_jobs for select
  using (status = 'published');
