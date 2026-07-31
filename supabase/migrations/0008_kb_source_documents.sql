-- Editable SOURCE documents for EVan's knowledge base (RAG).
--
-- Editors edit these human-readable docs in the CMS; on "Save & re-embed" the
-- serverless endpoint (api/admin/kb-ingest.ts) chunks + embeds the body with
-- Gemini and writes the vectors into the LIVE store `etus_kb_documents`
-- (vector(3072); see n8n/etus_kb_documents.sql) that the n8n agent retrieves
-- from. The vector chunks are derived output — this table is the editable truth.
--
-- Only editors touch this table (via the service-role /api/admin/* endpoints);
-- the public site never reads it, so RLS is enabled with no public policy.
--
-- Run in Supabase → SQL Editor (or `supabase db push`).

create table if not exists public.kb_source_documents (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  status           text        not null default 'draft',   -- draft | published
  source           text        not null unique,             -- metadata.source key (slug)
  title            text        not null default '',
  body             text        not null default '',          -- markdown
  last_embedded_at timestamptz,
  chunk_count      int         not null default 0
);

alter table public.kb_source_documents enable row level security;
-- No policies: only the service role (via /api/admin/*) can read/write.
