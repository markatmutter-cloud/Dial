-- collection_blocks: the composition layer for the Watchlists "living dossier"
-- (docs/WATCHLISTS_DOSSIER_SPEC.md). One row = one ordered block a user adds to
-- a list (Notion-style). Existing tables (collections, collection_items,
-- saved_searches) are unchanged; this only adds the ordering/composition layer.
--
-- Applied to prod via MCP 2026-05-27 (migration collection_blocks_dossier_composition).
-- RLS mirrors collection_items exactly: gated on the parent collection via the
-- existing can_view_collection / can_edit_collection helpers, no role clause.

create table if not exists public.collection_blocks (
  id              uuid primary key default gen_random_uuid(),
  collection_id   uuid not null references public.collections(id) on delete cascade,
  position        integer not null default 0,
  kind            text not null check (kind in
                    ('saved_search','saved_items','articles','reference_guide','note')),
  saved_search_id uuid references public.saved_searches(id) on delete set null,
  reference_id    text,
  note_text       text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists collection_blocks_collection_position_idx
  on public.collection_blocks (collection_id, position);

alter table public.collection_blocks enable row level security;

create policy "Users select viewable collection blocks" on public.collection_blocks
  for select using (can_view_collection(collection_id));
create policy "Users insert into editable collection blocks" on public.collection_blocks
  for insert with check (can_edit_collection(collection_id));
create policy "Users update editable collection blocks" on public.collection_blocks
  for update using (can_edit_collection(collection_id)) with check (can_edit_collection(collection_id));
create policy "Users delete editable collection blocks" on public.collection_blocks
  for delete using (can_edit_collection(collection_id));
