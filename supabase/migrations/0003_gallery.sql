-- Dynamic gallery (photos + videos), submitted via the n8n gallery form.
-- The site reads published rows with the anon key (RLS); n8n writes/archives
-- with the service_role key. Photos store a public image URL (uploaded to the
-- site-media bucket or pasted); videos store a YouTube/Vimeo id or a file URL.

create table if not exists public.site_gallery (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  status      text        not null default 'published',  -- published | archived
  kind        text        not null default 'photo',       -- photo | video
  title       text,                                        -- caption / shown on hover
  album       text,                                        -- optional grouping
  url         text        not null,                        -- image URL, or video id / file URL
  poster      text,                                        -- video thumbnail (vimeo/file)
  provider    text,                                        -- youtube | vimeo | file (videos)
  sort        int         not null default 0               -- lower = earlier
);

create index if not exists site_gallery_sort_idx on public.site_gallery (sort, created_at desc);

alter table public.site_gallery enable row level security;

drop policy if exists "public read published gallery" on public.site_gallery;
create policy "public read published gallery"
  on public.site_gallery for select
  using (status = 'published');
