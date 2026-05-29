-- 2026-05-28 — B-19: make RLS provable from code for the user-data tables.
--
-- Audit (2026-05-24, findings-security HIGH-1) flagged that
-- watchlist_items, hidden_listings, saved_searches and tracked_lots
-- carry correct owner-scoped policies in the repo (see
-- 2026-05-10_rls_initplan_perf.sql) but their `enable row level
-- security` was NEVER committed — those four tables were created
-- directly in the Supabase dashboard, so no CREATE / enable-RLS DDL
-- exists in code. Consequence: "RLS is on" can't be proven from the
-- repo, and a dashboard toggle could silently disable RLS (private ->
-- world-readable) with nothing in code to catch it or restore it.
--
-- (collections / collection_items already enable RLS in
-- 2026-05-01_collections.sql. "Challenges" is a *kind* of collection,
-- not a separate table — there is no `challenges` table to protect.)
--
-- Idempotent: enabling RLS on an already-protected table is a no-op, so
-- this file is safe to re-apply and stands as the authoritative,
-- re-runnable assertion that these four tables are RLS-protected. The
-- policies themselves remain defined in 2026-05-10_rls_initplan_perf.sql
-- (all owner-scoped `user_id = (select auth.uid())`, default public
-- role).

alter table public.watchlist_items enable row level security;
alter table public.hidden_listings enable row level security;
alter table public.saved_searches  enable row level security;
alter table public.tracked_lots    enable row level security;

-- ── listing_events: stop clients forging another user's user_id ──────
-- (audit findings-security MED-1.) The insert policy was
-- `with check (true)`, so any caller could insert an event row claiming
-- an ARBITRARY user_id — attributing fabricated engagement to a real
-- user. listing_events is anonymous-friendly BY DESIGN (user_id and
-- anon_session_id are both nullable; anon browsers write with only the
-- session UUID — see useEventTelemetry.js, which sets
-- `user_id: user ? user.id : null`). So we can't require auth; we only
-- forbid claiming a user_id that isn't yours. Both legitimate paths
-- still pass: anonymous inserts (user_id null) and signed-in inserts of
-- one's own id. This supersedes the "Anyone insert listing events"
-- policy created in 2026-05-05_listing_events.sql.
drop policy if exists "Anyone insert listing events" on public.listing_events;
create policy "Insert own or anonymous listing events"
  on public.listing_events for insert
  with check (user_id is null or user_id = (select auth.uid()));
