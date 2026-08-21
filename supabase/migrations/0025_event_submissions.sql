-- ─────────────────────────────────────────────────────────────────────────────
-- EVENT SUBMISSIONS — who sent us an event, kept apart from the event itself
--
-- The /list-your-event form now creates a DRAFT site_events row, so an editor
-- can review and publish it in /admin/content/events like any other event.
-- Publishing it emails the organiser their live link. That means we have to
-- remember who submitted it — and that is exactly what must NOT go on
-- site_events.
--
-- WHY A SEPARATE TABLE. site_events carries "public read published events"
-- (0001), which grants SELECT on EVERY COLUMN of a published row. Put the
-- organiser's email on site_events and it becomes public the instant the event
-- is approved — anyone could read it straight off the PostgREST endpoint with
-- the anon key. So the contact details live here instead, with RLS on and NO
-- policies, the same shape as site_form_submissions (0015) and site_analytics
-- (0002): unreachable with the anon key in either direction, service role only.
--
-- ON DELETE CASCADE: if an editor deletes a rejected event, the contact row it
-- carried should not outlive it. This table exists to serve that event.
--
-- Apply by running this in the Supabase SQL editor. Safe to run more than once.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.site_event_submissions (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  -- The draft event this submission produced.
  event_id            uuid not null references public.site_events(id) on delete cascade,
  submitter_name      text not null default '',
  submitter_email     text not null default '',
  submitter_phone     text not null default '',
  submitter_company   text not null default '',
  -- GoHighLevel contact id, so the approval email can be sent to an existing
  -- contact rather than creating a second one.
  ghl_contact_id      text,
  -- Stamped when the "your event is live" email goes out. Its presence is what
  -- stops a second email on every re-publish — an editor toggling an event off
  -- and on again must not re-notify the organiser.
  approval_emailed_at timestamptz,
  -- Why the email did not send, when it did not. Null on success.
  approval_email_error text
);

comment on table public.site_event_submissions is
  'Contact details behind a /list-your-event submission. Deliberately NOT on site_events, whose public read policy would expose them once the event is published.';

-- One submission per event is the normal case; the index is for the lookup on
-- publish, which is by event_id.
create index if not exists site_event_submissions_event_idx
  on public.site_event_submissions (event_id);

alter table public.site_event_submissions enable row level security;
-- No policies, on purpose. See the header.

-- Verify.
select
  (select count(*) from information_schema.columns
     where table_schema = 'public' and table_name = 'site_event_submissions') as columns,
  (select relrowsecurity from pg_class where relname = 'site_event_submissions') as rls_on,
  (select count(*) from pg_policies
     where schemaname = 'public' and tablename = 'site_event_submissions')     as policies;
