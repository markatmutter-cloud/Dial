-- 2026-05-29 — AI concierge chat: per-user daily usage + quota.
--
-- The watch-expert chat bot (Epic 9 "AI spine") calls the Anthropic API
-- from a Vercel serverless function (api/chat.js). Each call costs real
-- money, so every message is gated by a per-user daily cap enforced HERE
-- in the DB — the line of defense if a buggy/malicious client bypasses
-- any frontend check.
--
-- Mirrors the user_limits design (2026-05-06_user_limits.sql): a default
-- cap, a per-user override column, an admin grant-by-email helper. The
-- difference from watchlist_cap is that this is a PER-DAY count (not a
-- row count), and the function is called read-before-spend (the endpoint
-- reserves a message, then calls Claude), so enforcement lives in a
-- SECURITY DEFINER RPC rather than a BEFORE-INSERT trigger.
--
-- Run order: paste into the Supabase SQL editor and execute. Idempotent.
-- Ship this migration BEFORE the api/chat.js that calls these RPCs
-- (CLAUDE.md: JS referencing a not-yet-created RPC breaks).

-- ── chat_cap on user_limits ──────────────────────────────────────────
-- Per-user override of the daily message cap. No value = default below.
-- Reuses the existing user_limits table so one admin surface covers both
-- the watchlist cap and the chat cap.
alter table public.user_limits
  add column if not exists chat_cap integer not null default 20
    check (chat_cap >= 0 and chat_cap <= 10000);

-- ── default_chat_cap() ───────────────────────────────────────────────
-- Single source of truth for the system-wide daily default (20/day).
-- Bumping it here applies to every user without a user_limits row.
create or replace function public.default_chat_cap()
returns integer
language sql
immutable
set search_path = ''   -- pin (linter: function_search_path_mutable)
as $$ select 20 $$;

-- ── ai_chat_usage (per-user, per-day rollup) ─────────────────────────
-- One row per (user, day). message_count drives the cap; token columns
-- are for spend monitoring. PK (user_id, day) makes the increment a
-- clean upsert.
create table if not exists public.ai_chat_usage (
  user_id       uuid not null references auth.users(id) on delete cascade,
  day           date not null default current_date,
  message_count integer not null default 0,
  input_tokens  bigint  not null default 0,
  output_tokens bigint  not null default 0,
  model         text,                     -- last model used that day (haiku/opus)
  updated_at    timestamptz not null default now(),
  primary key (user_id, day)
);

create index if not exists ai_chat_usage_day_idx
  on public.ai_chat_usage (day desc);

alter table public.ai_chat_usage enable row level security;

do $$ begin
  -- Users can read their own usage so the UI can show "N left today".
  if not exists (select 1 from pg_policies
    where schemaname='public' and tablename='ai_chat_usage' and policyname='Users select own chat usage') then
    create policy "Users select own chat usage"
      on public.ai_chat_usage for select using (auth.uid() = user_id);
  end if;
  -- Only admins can mutate directly; the SECURITY DEFINER RPCs below do
  -- the real writes (and bypass RLS), so regular users never INSERT here.
  if not exists (select 1 from pg_policies
    where schemaname='public' and tablename='ai_chat_usage' and policyname='Admins manage chat usage') then
    create policy "Admins manage chat usage"
      on public.ai_chat_usage for all
      using (public.is_admin())
      with check (public.is_admin());
  end if;
end $$;

-- ── consume_chat_quota() ─────────────────────────────────────────────
-- Called by api/chat.js (with the user's JWT) BEFORE spending an
-- Anthropic call. Resolves auth.uid() internally so a caller can't spoof
-- another user. Counts today's messages, compares to the user's cap
-- (override or default), and either:
--   • raises P0001 'chat_cap_exceeded' if at/over the cap, OR
--   • increments today's message_count and returns messages remaining.
-- The P0001 code lets the endpoint return a friendly 429 (mirrors the
-- watchlist-cap UX).
create or replace function public.consume_chat_quota()
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  uid uuid;
  cap integer;
  used integer;
begin
  uid := auth.uid();
  if uid is null then
    raise exception 'not authenticated';
  end if;

  select coalesce(
    (select chat_cap from public.user_limits where user_id = uid),
    public.default_chat_cap()
  ) into cap;

  -- Upsert today's row, incrementing the count atomically. The WHERE on
  -- the conflict path enforces the cap so concurrent requests can't race
  -- past it: if the row is already at cap, no update happens.
  insert into public.ai_chat_usage (user_id, day, message_count)
    values (uid, current_date, 1)
  on conflict (user_id, day) do update
    set message_count = public.ai_chat_usage.message_count + 1,
        updated_at    = now()
    where public.ai_chat_usage.message_count < cap
  returning message_count into used;

  if used is null then
    -- No row returned ⇒ the conflict WHERE failed ⇒ already at cap.
    raise exception 'chat_cap_exceeded: daily limit of % messages reached', cap
      using errcode = 'P0001';
  end if;

  return cap - used;  -- messages remaining today
end;
$$;

-- ── log_chat_tokens() ────────────────────────────────────────────────
-- Called by api/chat.js AFTER the Anthropic call returns, to record
-- token spend on today's row (which consume_chat_quota already created).
-- Additive so multi-turn tool-use loops can log their total. Resolves
-- auth.uid() internally.
create or replace function public.log_chat_tokens(
  p_input  bigint,
  p_output bigint,
  p_model  text
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
  update public.ai_chat_usage
    set input_tokens  = input_tokens  + coalesce(p_input, 0),
        output_tokens = output_tokens + coalesce(p_output, 0),
        model         = coalesce(p_model, model),
        updated_at    = now()
    where user_id = uid and day = current_date;
end;
$$;

-- ── set_chat_cap_by_email (admin convenience) ────────────────────────
-- Admin-only helper to expand a user's daily chat cap by email, without
-- looking up their auth user_id. Clones set_watchlist_cap_by_email.
create or replace function public.set_chat_cap_by_email(
  user_email text,
  new_cap integer,
  note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_id uuid;
begin
  if not public.is_admin() then
    raise exception 'admin_only: only admins can set chat caps';
  end if;
  if new_cap < 0 or new_cap > 10000 then
    raise exception 'invalid_cap: must be between 0 and 10000, got %', new_cap;
  end if;

  select id into target_id from auth.users where email = user_email limit 1;
  if target_id is null then
    raise exception 'no_such_user: no user with email %', user_email;
  end if;

  insert into public.user_limits (user_id, chat_cap, notes, updated_by)
    values (target_id, new_cap, note, auth.uid())
  on conflict (user_id) do update
    set chat_cap   = excluded.chat_cap,
        notes      = coalesce(excluded.notes, public.user_limits.notes),
        updated_at = now(),
        updated_by = excluded.updated_by;

  return target_id;
end;
$$;

-- ── ACLs ─────────────────────────────────────────────────────────────
-- EMPIRICAL (verified on this project 2026-05-29): these new functions
-- received a DIRECT EXECUTE grant to `anon` — so `revoke … from public`
-- alone was a no-op (anon still had EXECUTE). This matches the CLAUDE.md
-- "public-schema ACL gotcha" note, NOT the 2026-05-10 file's claim that
-- revoke-from-public suffices (platform behavior differs per function).
-- Belt-and-braces: revoke from BOTH public and anon, then grant to
-- authenticated. All three RPCs require a real auth.uid()/admin anyway.
revoke execute on function public.consume_chat_quota()                       from public, anon;
revoke execute on function public.log_chat_tokens(bigint, bigint, text)      from public, anon;
revoke execute on function public.set_chat_cap_by_email(text, integer, text) from public, anon;

grant execute on function public.consume_chat_quota()                      to authenticated;
grant execute on function public.log_chat_tokens(bigint, bigint, text)     to authenticated;
grant execute on function public.set_chat_cap_by_email(text, integer, text) to authenticated;

-- Verify intent (done 2026-05-29): has_function_privilege('anon', …,
-- 'EXECUTE') = false for all three; authenticated = true.
