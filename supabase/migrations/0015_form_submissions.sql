-- ─────────────────────────────────────────────────────────────────────────────
-- FORM SUBMISSIONS — the site's own record of what visitors send us
--
-- Today NOTHING is stored. api/lead.ts is a pure proxy: it upserts the visitor
-- into GoHighLevel and, best-effort, attaches a note. If GHL is unreachable, if
-- the note POST fails, or if someone deletes the contact, the submission is
-- simply gone — and the CMS has nothing to show. This table is that missing
-- record: every form the site receives, so /admin/content/submissions can list
-- one and open it.
--
-- IT IS NOT A CRM. GoHighLevel stays the system of record for the PERSON —
-- dedupe across forms, tags, workflows, follow-up. This is the system of record
-- for the EVENT: on this day, from this page, this is what they typed. Do not
-- hang follow-up automation off this table.
--
-- WHY REAL COLUMNS *AND* jsonb, rather than one or the other:
--   The ~20 form types send different fields, but api/lead.ts already proves
--   they share a core shape — the fields it maps onto GoHighLevel's standard
--   contact fields, plus subject and message. Those become real columns, so the
--   CMS list can sort, filter, search and index on them. Everything else varies
--   per form and changes whenever a form changes (jobLink, vehicleSummary,
--   shareChannel, the EVan transcript…), so it lives in `payload` and a new
--   form field never costs a migration.
--   All-jsonb would make every list query an unindexed payload->>'email' and
--   force the UI to defend against each value being a string, number, array or
--   absent. All-columns would make every new form field a migration.
--
-- WHAT `payload` MAY HOLD: a FLAT object of string -> string, built from an
--   explicit server-side allow-list in api/_submissions.ts, with values trimmed
--   and length-capped. No nesting, no arrays, no client-chosen key names.
--   api/lead.ts currently spreads `...rest` and writes EVERY unknown key a
--   client sends verbatim into the GHL note. That defect stops at the helper
--   and is deliberately NOT re-created here.
--
-- DELIBERATELY NO `status` COLUMN. api/admin.ts treats any table carrying one
--   as ARCHIVABLE, turning delete into update({status:'archived'}). On a table
--   holding personal data that would mean telling somebody their data was
--   erased while the row sat intact. Deletion here must always be a real
--   DELETE, so the column that would silently change that does not exist.
--
-- PRIVACY: rows hold names, emails, phone numbers, IP addresses, coarse geo and
--   (for EVan) chat transcripts — the first bulk store of visitor personal data
--   in this project. Same disclosure duty as api/track.ts. The CMS screen is
--   gated to editors and admins; the `viewer` and `author` roles cannot read it.
--
-- ACCESS: RLS ON with NO POLICIES, exactly like site_analytics (0002) and
--   site_activity (0011). The anon key can neither read nor write this table.
--   Only the service role — i.e. the serverless functions — can touch it.
--
-- Apply by running this in the Supabase SQL editor. Safe to run more than once.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.site_form_submissions (
  id              uuid        primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),

  -- what was submitted
  form_type       text        not null,   -- a key of FORM_TAGS in api/lead.ts
  form_label      text,                   -- SOURCE_LABEL snapshot, for display

  -- who — the shape every form shares
  first_name      text,
  last_name       text,
  email           text,                   -- stored lower-cased
  phone           text,                   -- phone or mobile, whichever arrived
  company         text,
  city            text,
  zip             text,

  -- what they said
  subject         text,
  message         text,

  -- everything else, per form type (flat string -> string, allow-listed)
  payload         jsonb       not null default '{}'::jsonb,

  -- where it came from
  page_path       text,
  referrer        text,
  ip              text,
  geo_city        text,
  geo_region      text,
  geo_country     text,
  user_agent      text,

  -- what happened downstream
  ghl_contact_id  text,
  crm_delivery    text        not null default 'unknown',

  constraint site_form_submissions_crm_delivery_chk
    check (crm_delivery in ('sent', 'failed', 'unknown'))
);

comment on table public.site_form_submissions is
  'Local record of every form submission. GoHighLevel remains the CRM; this is the event log. Has no status column ON PURPOSE — see api/admin.ts ARCHIVABLE, deletion here must be a real DELETE.';

comment on column public.site_form_submissions.form_type is
  'Matches a key of FORM_TAGS in api/lead.ts, e.g. contact-us, newsletter, job-apply.';
comment on column public.site_form_submissions.payload is
  'Per-form extras. Flat string -> string only, from the allow-list in api/_submissions.ts. Never the raw request body.';
comment on column public.site_form_submissions.crm_delivery is
  'Whether the GoHighLevel upsert succeeded for this submission: sent | failed | unknown. Lets the CMS surface leads that never reached the CRM.';

-- The list screen reads newest-first, usually filtered by form type.
create index if not exists site_form_submissions_created_idx
  on public.site_form_submissions (created_at desc);
create index if not exists site_form_submissions_type_created_idx
  on public.site_form_submissions (form_type, created_at desc);
-- Case-insensitive lookup by person, for "show me everything from this address"
-- and for honouring a deletion request.
create index if not exists site_form_submissions_email_idx
  on public.site_form_submissions (lower(email));

-- RLS on, no policies: unreachable with the anon key in either direction. The
-- serverless functions use the service role, which bypasses RLS entirely.
alter table public.site_form_submissions enable row level security;
