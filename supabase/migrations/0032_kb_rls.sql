-- Lock the RAG knowledge-base tables the way every other table here is locked.
--
-- public.etus_kb_documents is the vector store EVan answers from, and
-- public.kb_documents is the older 768-dim scaffold that scripts/ingest_kb.py
-- still writes to. Both were created outside the migration folder — in
-- n8n/etus_kb_documents.sql and supabase/rag-kb.sql — and neither file ever
-- turned row level security on.
--
-- That matters because Supabase grants the anon and authenticated roles full
-- CRUD on any public-schema table WITHOUT RLS, and the anon key ships in the
-- production JavaScript bundle, where anyone can read it. The exposure is not
-- theft — these tables hold published programme text — it is WRITES: anyone
-- could insert rows that EVan would then retrieve and repeat to visitors as
-- its own knowledge, or delete the embeddings entirely.
--
-- Every other table in this schema states the same posture, e.g.
-- 0008_kb_source_documents.sql: "the public site never reads it, so RLS is
-- enabled with no public policy". These two were simply missed.
--
-- No policy is added on purpose. Both writers hold the service-role key, which
-- bypasses RLS: api/admin.ts writes through adminSupabase(), n8n uses its own
-- Supabase credential, and scripts/ingest_kb.py must be run with
-- SUPABASE_KEY set to the service-role key rather than the anon key.
--
-- Safe to re-run.

alter table if exists public.etus_kb_documents enable row level security;
alter table if exists public.kb_documents      enable row level security;

-- The retrieval RPCs are plain (not SECURITY DEFINER), so they run as the
-- caller and inherit the same protection: a stranger calling
-- match_etus_kb_documents() with the anon key now gets nothing back, while n8n
-- calling it with the service-role key is unaffected.

-- Belt and braces: take the write grants away as well, so a future policy
-- added for reads cannot silently re-open writes.
revoke insert, update, delete on public.etus_kb_documents from anon, authenticated;
revoke insert, update, delete on public.kb_documents      from anon, authenticated;
