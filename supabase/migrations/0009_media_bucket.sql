-- Widen the public `site-media` bucket so the CMS media library can also hold
-- short video files (not just images). Raises the size limit to 50 MB and adds
-- common video MIME types. Idempotent.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-media', 'site-media', true, 52428800,
        array['image/png', 'image/jpeg', 'image/webp', 'image/gif',
              'video/mp4', 'video/webm', 'video/quicktime'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
