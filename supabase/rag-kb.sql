-- ============================================================================
-- RAG knowledge base for the EVA chatbot.
-- Run this once in the Supabase SQL editor (Dashboard → SQL → New query → Run).
--
-- Stores the chunked + embedded documents the chatbot retrieves from. Sized for
-- Google Gemini `text-embedding-004` (768 dimensions). Matches the LangChain /
-- n8n "Supabase Vector Store" contract so the n8n node works out of the box:
--   • table:    kb_documents (content, metadata, embedding)
--   • function: match_kb_documents(query_embedding, match_count, filter)
-- ============================================================================

create extension if not exists vector;

create table if not exists kb_documents (
  id        bigserial primary key,
  content   text,
  metadata  jsonb default '{}'::jsonb,   -- {source, title, doc_id, chunk, …}
  embedding vector(768)                  -- Gemini text-embedding-004
);

-- Cosine-distance index for fast nearest-neighbour search.
create index if not exists kb_documents_embedding_idx
  on kb_documents using hnsw (embedding vector_cosine_ops);

-- Optional: filter by source document quickly when re-indexing/deleting.
create index if not exists kb_documents_metadata_idx
  on kb_documents using gin (metadata);

-- Similarity search used by the n8n Supabase Vector Store retrieval tool.
create or replace function match_kb_documents (
  query_embedding vector(768),
  match_count     int   default 6,
  filter          jsonb default '{}'::jsonb
) returns table (
  id         bigint,
  content    text,
  metadata   jsonb,
  similarity float
) language plpgsql as $$
begin
  return query
  select
    kb_documents.id,
    kb_documents.content,
    kb_documents.metadata,
    1 - (kb_documents.embedding <=> query_embedding) as similarity
  from kb_documents
  where kb_documents.metadata @> filter
  order by kb_documents.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- To re-index a single source later: delete from kb_documents
--   where metadata->>'source' = '<doc-name>';
