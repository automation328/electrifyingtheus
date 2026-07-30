-- Supabase vector store for the live "Electrifying the US" EVan agent (RAG).
-- Run once in the Supabase SQL editor (project: "Electrifying the US").
-- The n8n vector-store node embeds with Google Gemini `gemini-embedding-001`
-- which outputs 3072-dim vectors, so the column must be vector(3072).

create extension if not exists vector;

create table if not exists public.etus_kb_documents (
  id        uuid primary key default gen_random_uuid(),
  content   text,
  metadata  jsonb,
  embedding vector(3072)
);

-- Similarity-search RPC. The name must match the n8n retrieval node's
-- queryName (match_etus_kb_documents).
create or replace function public.match_etus_kb_documents (
  query_embedding vector(3072),
  match_count int default null,
  filter jsonb default '{}'
) returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
) language plpgsql as $$
begin
  return query
  select etus_kb_documents.id,
         etus_kb_documents.content,
         etus_kb_documents.metadata,
         1 - (etus_kb_documents.embedding <=> query_embedding) as similarity
  from etus_kb_documents
  where etus_kb_documents.metadata @> filter
  order by etus_kb_documents.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- To fully re-ingest the knowledge base, clear the table first:
--   truncate table public.etus_kb_documents;
