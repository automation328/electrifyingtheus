-- Normalise site_gallery.kind to the two values 0003 documents: photo | video.
--
-- The CMS "Add from library" button used to copy the media library's own word
-- for a still image ("image") straight into the row, so imported photos landed
-- on kind = 'image'. Three things read the column and none of them know that
-- value:
--   * the Gallery list groups by kind, so those rows fell into a third section
--     labelled "image" instead of joining Photos;
--   * the Photos / Videos filter matches 'photo', so they were missing from it;
--   * the built-in gallery entries are de-duped against rows by "kind|url"
--     (configs.ts keyOf), so an imported copy of a curated photo no longer
--     matched its original and both were listed.
--
-- The public page never split on it — fetchGallery treats anything that is not
-- 'video' as a photo — so this changes the CMS, not the site.
--
-- Anything that is not a video is a photo, which is the same rule the site
-- applies, so a stray third value gets fixed here too.
update public.site_gallery
   set kind = 'photo'
 where kind is distinct from 'video'
   and kind is distinct from 'photo';
