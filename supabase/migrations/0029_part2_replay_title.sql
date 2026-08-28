-- Retitle the Part 2 webinar replay page and repoint it at the re-uploaded video.
--
-- The live headline comes from the CMS override in site_pages, not from
-- src/pages/FromPumpToPlugPart2.tsx — the code default is only used when the
-- published row omits a field. The override read
--   "Watch The Replay - Webinar Series Part 2:    How EVs Can Save You Thousands"
-- (with a stray run of spaces) and lists "highlight" under `cleared`, so the
-- headline renders as one string with no gradient tail.
--
-- This sets the new headline and leaves `cleared` alone, so the page keeps
-- rendering a single-line title. The code default was updated in the same change
-- and splits the same wording across title + highlight, which is what a visitor
-- sees if this row is ever unpublished or deleted.
--
-- The video moves too. The old id SGtCmPLpyCI was taken down when the edited cut
-- went up as a fresh upload: oEmbed and every thumbnail size return 404, which is
-- why the player was showing the grey placeholder rather than the panel card. The
-- replacement _HRXa3hjlec resolves to "National Webinar Series pt. 2 | From The
-- Pump To The Plug" on the Electrifying The US channel, with a real 226KB
-- maxresdefault.jpg -- the layout builds its poster frame from that URL, so a
-- missing one ships a broken still.
--
-- Both values were applied through the CMS on 2026-08-29 and are already live;
-- this migration restates them so a rebuilt database lands in the same place.
--
-- Run in Supabase -> SQL Editor (or `supabase db push`).

update public.site_pages
set content = jsonb_set(
      jsonb_set(
        content,
        '{title}',
        to_jsonb('Watch The Webinar: Part 2 - From The Pump To The Plug, How EVs Can Save Thousands'::text),
        true
      ),
      '{video,youtubeId}',
      to_jsonb('_HRXa3hjlec'::text),
      true
    ),
    updated_at = now()
where path = '/from-pump-to-plug-part-2';
