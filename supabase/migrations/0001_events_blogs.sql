-- Dynamic Events + Blog posts, submitted via the n8n form and read by the site.
--
-- The website reads these tables with the anon key (public SELECT of published
-- rows only). The n8n workflow writes/deletes rows with the SERVICE ROLE key,
-- which bypasses RLS — so there is intentionally no anon INSERT/DELETE policy.
--
-- Run in Supabase → SQL Editor (or `supabase db push`).

-- ─────────────────────────────────────────────────────────────────────────────
-- EVENTS
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.site_events (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  status      text        not null default 'published',  -- published | draft | archived
  event_date  date        not null,                       -- sort + derive month/day/year
  title       text        not null,
  type        text        not null default 'Event',       -- Ride & Drive, Webinar, Expo…
  location    text        not null default '',            -- full venue line
  region      text        not null default '',            -- city/region for alert matching
  time        text        not null default '',            -- "10:00 AM – 4:00 PM EDT"
  description text        not null default '',
  image       text,                                        -- public image URL
  featured    boolean     not null default false
);

create index if not exists site_events_date_idx on public.site_events (event_date);

-- ─────────────────────────────────────────────────────────────────────────────
-- BLOG POSTS
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.site_blog_posts (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  status        text        not null default 'published',
  slug          text        not null unique,
  title         text        not null,
  excerpt       text        not null default '',
  category      text        not null default 'News',
  date          text        not null default '',          -- display date, e.g. "May 18, 2026"
  published_at  date,                                       -- machine-sortable date
  author        text        not null default 'Electrifying the US Team',
  read_time     text        not null default '3 min read',
  image         text,                                        -- public image URL
  featured      boolean     not null default false,
  content       text        not null default ''            -- markdown body
);

create index if not exists site_blog_posts_published_idx on public.site_blog_posts (published_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row-Level Security — public can read PUBLISHED rows; no anon writes.
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.site_events     enable row level security;
alter table public.site_blog_posts enable row level security;

drop policy if exists "public read published events" on public.site_events;
create policy "public read published events"
  on public.site_events for select
  using (status = 'published');

drop policy if exists "public read published posts" on public.site_blog_posts;
create policy "public read published posts"
  on public.site_blog_posts for select
  using (status = 'published');
