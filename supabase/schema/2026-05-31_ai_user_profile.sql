-- Lumé taste profile / memory store (2026-05-31). One private, user-owned row per
-- user holding an evolving taste profile (JSONB). RLS: a user can only see/edit
-- their own row. `enabled` lets the user (or a test/incognito mode) turn memory off.
-- Applied via MCP apply_migration (name: ai_user_profile).
create table if not exists public.ai_user_profile (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  enabled    boolean not null default true,
  profile    jsonb   not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.ai_user_profile enable row level security;

-- No role clause (per the project's RLS convention) — own-row only.
create policy ai_profile_select on public.ai_user_profile
  for select using (auth.uid() = user_id);
create policy ai_profile_insert on public.ai_user_profile
  for insert with check (auth.uid() = user_id);
create policy ai_profile_update on public.ai_user_profile
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy ai_profile_delete on public.ai_user_profile
  for delete using (auth.uid() = user_id);
