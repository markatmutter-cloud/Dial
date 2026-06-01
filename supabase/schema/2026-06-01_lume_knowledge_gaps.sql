-- 2026-06-01 — Lumé knowledge gaps (the web-search → guide demand signal).
--
-- Every time Lumé reaches the open web (api/chat.js, the native web_search
-- tool), it's a signal our own corpus couldn't answer that question. Logging
-- those events turns "what should I research/author next" into DATA: a
-- demand-ranked backlog of which reference guides/articles to build, with the
-- result URLs already gathered as research seed. The back half of the
-- knowledge-gap loop (docs/REFERENCE_ENRICHMENT.md / LUME_ROADMAP).
--
-- Write-only from the endpoint via a SECURITY DEFINER RPC (the documented
-- RLS-rejection fallback — a direct authenticated INSERT is silently rejected
-- on this project). Reads are admin-only (Mark, via MCP / is_admin()).
--
-- Run order: apply this BEFORE the api/chat.js that calls log_knowledge_gap
-- (CLAUDE.md: JS referencing a not-yet-created RPC breaks). Idempotent.

-- ── lume_knowledge_gaps ──────────────────────────────────────────────
-- One row per turn where Lumé used web search. question = the user's ask;
-- queries = the search strings Lumé issued; results = [{url,title}] it cited;
-- corpus_tried = whether it called get_reference/search_articles first (web is
-- last-resort, so true ⇒ "our corpus came up short").
create table if not exists public.lume_knowledge_gaps (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  question     text,
  queries      jsonb not null default '[]'::jsonb,   -- ["tudor snowflake 9411", …]
  results      jsonb not null default '[]'::jsonb,   -- [{"url":…, "title":…}, …]
  corpus_tried boolean not null default false,
  model        text
);

create index if not exists lume_knowledge_gaps_created_idx
  on public.lume_knowledge_gaps (created_at desc);

alter table public.lume_knowledge_gaps enable row level security;

do $$ begin
  -- Admin-only access (analytics surface for Mark). Regular users never read
  -- or write directly; the SECURITY DEFINER RPC below does the inserts and
  -- bypasses RLS.
  if not exists (select 1 from pg_policies
    where schemaname='public' and tablename='lume_knowledge_gaps' and policyname='Admins manage knowledge gaps') then
    create policy "Admins manage knowledge gaps"
      on public.lume_knowledge_gaps for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end $$;

-- ── log_knowledge_gap() ──────────────────────────────────────────────
-- Called by api/chat.js (with the user's JWT) AFTER a turn that used web
-- search. Resolves auth.uid() internally so a caller can't spoof another user.
-- Best-effort on the client side (wrapped in try/catch) — never blocks the reply.
create or replace function public.log_knowledge_gap(
  p_question     text,
  p_queries      jsonb,
  p_results      jsonb,
  p_corpus_tried boolean,
  p_model        text
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid;
begin
  uid := auth.uid();
  if uid is null then
    raise exception 'not authenticated';
  end if;
  insert into public.lume_knowledge_gaps (user_id, question, queries, results, corpus_tried, model)
    values (uid,
            left(coalesce(p_question, ''), 2000),
            coalesce(p_queries, '[]'::jsonb),
            coalesce(p_results, '[]'::jsonb),
            coalesce(p_corpus_tried, false),
            p_model);
end;
$$;

-- ── ACLs ─────────────────────────────────────────────────────────────
-- Same gotcha as 2026-05-29_ai_chat_usage: new functions get a DIRECT EXECUTE
-- grant to anon, so revoke from BOTH public and anon, then grant to
-- authenticated (the RPC requires a real auth.uid() anyway).
revoke execute on function public.log_knowledge_gap(text, jsonb, jsonb, boolean, text) from public, anon;
grant  execute on function public.log_knowledge_gap(text, jsonb, jsonb, boolean, text) to authenticated;

-- Verify (run after apply):
--   select has_function_privilege('anon',          'public.log_knowledge_gap(text,jsonb,jsonb,boolean,text)', 'EXECUTE'); -- false
--   select has_function_privilege('authenticated', 'public.log_knowledge_gap(text,jsonb,jsonb,boolean,text)', 'EXECUTE'); -- true
