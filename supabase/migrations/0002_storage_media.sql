-- Public Storage bucket for blog/event images uploaded via the n8n forms.
--
-- The n8n "Site Blog" / "Site Events" forms upload the chosen image to this
-- bucket with the SERVICE ROLE key (bypasses RLS), then store the public object
-- URL on the row. The website reads images via the public URL. Idempotent.
--
-- (Already created on the live project via the Storage API — this file mirrors it
-- so the bucket is reproducible with `supabase db push` / SQL Editor.)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-media', 'site-media', true, 10485760,
        array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do update
  set public            = excluded.public,
      file_size_limit   = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
