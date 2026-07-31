-- CMS editors allow-list — the second gate on every /api/admin/* write.
--
-- Editing is invite-only: a person can edit content only if BOTH
--   (1) they have a Supabase Auth account (created by an admin — public signups
--       are disabled in Auth settings), AND
--   (2) their email is a row in this table.
--
-- The website never writes here. The /api/admin/* serverless functions read this
-- table with the SERVICE ROLE key (bypasses RLS) to authorize each request. A
-- signed-in editor may read ONLY their own row (to confirm access + role in the
-- admin UI); no one can read the full list or write from the browser.
--
-- Seed the first editor after creating their Auth user:
--   insert into public.editors (email, role) values ('you@example.com', 'admin');
--
-- Run in Supabase → SQL Editor (or `supabase db push`).

create table if not exists public.editors (
  id         uuid        primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  email      text        not null unique,
  role       text        not null default 'editor'   -- editor | admin
);

-- Store/compare emails case-insensitively.
create unique index if not exists editors_email_lower_idx
  on public.editors (lower(email));

alter table public.editors enable row level security;

-- A signed-in user may read only their OWN editor row (used by /api/admin/me and
-- the admin UI to confirm the account is authorized). Everything else is denied;
-- the service role bypasses RLS for the actual authorization checks + writes.
drop policy if exists "editor reads own row" on public.editors;
create policy "editor reads own row"
  on public.editors for select
  using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));
