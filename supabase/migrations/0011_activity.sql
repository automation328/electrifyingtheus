-- CMS activity log — an audit trail of who changed what, for the multi-user CMS.
--
-- Written ONLY by the /api/admin serverless function (service role) after a
-- successful mutation; read back by the admin-only Activity screen. The website
-- never touches this table. Logging is best-effort — if this table doesn't exist
-- yet, writes still succeed (the server swallows the logging error).
--
-- Run in Supabase → SQL Editor (or `supabase db push`).

create table if not exists public.site_activity (
  id         uuid        primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor      text        not null,   -- editor email
  role       text,                   -- their role at the time
  action     text        not null,   -- insert | update | delete | publish | unpublish | user.add | user.role | user.remove | user.password | user.invite | upload | kb
  target     text,                   -- table / entity affected
  summary    text                    -- short human-readable description
);

create index if not exists site_activity_created_idx on public.site_activity (created_at desc);

-- No browser access: RLS on with no policies denies anon/authenticated entirely;
-- the service role (server) bypasses RLS for the log writes + the admin read.
alter table public.site_activity enable row level security;
