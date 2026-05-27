-- Screening collapse PR4 — DB clean-slate (2026-05-26).
--
-- The swipe screener was reshaped to a binary skip/heart that saves to
-- the watchlist (PR #598). The collaborative-reaction system (👍/❌/❤️
-- on shared-list items) and the auction auto-list workflow were then
-- removed from the frontend (PRs #599, #600), leaving these DB objects
-- unreferenced. This migration drops them.
--
-- IRREVERSIBLE. Applied via MCP 2026-05-26 (Mark confirmed). Deleted
-- 191 reaction rows, 3 auto-created auction-catalog lists, and their
-- 740 items. Hearted/saved watches live in watchlist_items and were
-- NOT touched.
--
-- Supersedes the forward DDL in: 2026-05-10_reactions.sql,
-- 2026-05-10_reaction_counts.sql, 2026-05-20_my_reactions_with_items.sql
-- (and the reaction entries in 2026-05-09_realtime_publication.sql,
-- 2026-05-10_fk_covering_indexes.sql, 2026-05-10_rls_initplan_perf.sql,
-- all removed by the CASCADE below).

-- 1. Reaction RPCs.
drop function if exists public.list_item_reactions(uuid);
drop function if exists public.list_reaction_counts_for_user();
drop function if exists public.my_reactions_with_items();

-- 2. Auction auto-list RPC.
drop function if exists public.get_or_create_auction_list(text, text, integer);

-- 3. Reactions table — CASCADE drops its RLS policies, indexes, and
--    realtime-publication membership too.
drop table if exists public.collection_item_reactions cascade;

-- 4. Auto-created auction-catalog lists + their items.
delete from public.collection_items
  where collection_id in (select id from public.collections where type = 'auction');
delete from public.collections where type = 'auction';
