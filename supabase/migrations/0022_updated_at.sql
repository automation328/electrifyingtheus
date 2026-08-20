-- ─────────────────────────────────────────────────────────────────────────────
-- updated_at — the column four tables were always written as if they had
--
-- THE BUG: publishing an inline edit on an event fails with
--
--   Could not find the 'updated_at' column of 'site_events' in the schema cache
--
-- InlinePageEditor stamps updated_at onto whatever table the inline fields
-- target (inline/InlinePageEditor.tsx:212 for an existing row, :215 for one it
-- adopts). That write runs BEFORE the site_pages write, so PostgREST rejects it
-- and the whole publish aborts — the block edits are lost along with the field
-- edit, which is why it looks like nothing saved rather than like one field
-- failed.
--
-- 0007 gave site_pages the column and three later tables never got it, so the
-- editor worked on pages and failed everywhere else. incentive-edit.ts:242
-- stamps it too — with a test asserting the stamp (incentive-edit.test.ts:240)
-- — so the code's intent has been consistent all along. The schema simply never
-- caught up.
--
-- WHY ADD THE COLUMN RATHER THAN STOP WRITING IT: several call sites want it,
-- one is pinned by a test, and "when was this last edited" is worth having on
-- content tables. Stripping the writes would mean deleting behaviour that was
-- deliberately built and tested.
--
-- Definition copied from 0007 so the four match site_pages exactly. NOT NULL
-- with a default, so every existing row gets a value and no insert has to
-- supply one.
--
-- NO TRIGGER. The app sets updated_at explicitly on every write, and a trigger
-- would silently overwrite whatever it sent — including in the migrations that
-- backfill content, where "now" is the wrong answer.
--
-- Apply by running this in the Supabase SQL editor. Safe to run more than once.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.site_events
  add column if not exists updated_at timestamptz not null default now();

alter table public.site_blog_posts
  add column if not exists updated_at timestamptz not null default now();

alter table public.site_gallery
  add column if not exists updated_at timestamptz not null default now();

alter table public.site_incentives
  add column if not exists updated_at timestamptz not null default now();

comment on column public.site_events.updated_at is
  'Last edit, stamped by the client on every write. See 0022 — its absence broke inline publishing on every event page.';

-- Verify: all five content tables should now report the column.
select table_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and column_name = 'updated_at'
  and table_name in ('site_pages', 'site_events', 'site_blog_posts', 'site_gallery', 'site_incentives')
order by table_name;
