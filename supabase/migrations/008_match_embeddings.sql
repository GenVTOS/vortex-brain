-- ─────────────────────────────────────────────────────────────────────────
-- 008_match_embeddings.sql — company-scoped vector search RPC.
-- The WHERE filter (company) is applied BEFORE the ORDER BY (rank) — the #1
-- company-wall rule (hardening V-3.1). Called only via the service-role admin
-- client after the API has authorized the caller; execute revoked from
-- anon/authenticated.
--
-- Scope semantics (the wall):
--   match_company NULL + include_core TRUE   → owner: every company + Michael Core ('all')
--   match_company NULL + include_core FALSE  → EA: all companies' business, NO 'all' identity
--   match_company '<id>' + include_core FALSE → team: that company ONLY (no 'all')
--   match_company '<id>' + include_core TRUE  → twin (internal): that company + Michael Core
-- ─────────────────────────────────────────────────────────────────────────

drop function if exists public.match_embeddings(text, text, int);

create or replace function public.match_embeddings(
  query_embedding text,
  match_company text,
  include_core boolean default false,
  match_count int default 10
)
returns table (source_type text, company_id text, content text, similarity float)
language sql
stable
security definer
set search_path = public
as $$
  select e.source_type, e.company_id, e.content,
         1 - (e.embedding <=> query_embedding::vector(1024)) as similarity
  from embeddings e
  where e.embedding is not null
    and case
          when match_company is null
            then (include_core or e.company_id is distinct from 'all')
          else (e.company_id = match_company or (include_core and e.company_id = 'all'))
        end
  order by e.embedding <=> query_embedding::vector(1024)
  limit match_count;
$$;

revoke execute on function public.match_embeddings(text, text, boolean, int) from anon, authenticated;
