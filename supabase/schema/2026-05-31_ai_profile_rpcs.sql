-- Reliable write + management RPCs for Lumé memory (ai_user_profile). SECURITY
-- DEFINER, set user_id := auth.uid() internally — the project's documented fallback
-- for direct authenticated INSERTs being rejected regardless of RLS (pattern:
-- create_challenge_v2). Reads go direct (RLS own-row select). Applied via MCP.
create or replace function public.upsert_ai_profile(p_profile jsonb)
returns void language plpgsql security definer set search_path to 'public', 'auth' as $$
declare uid uuid;
begin
  uid := auth.uid();
  if uid is null then raise exception 'not authenticated'; end if;
  insert into public.ai_user_profile (user_id, profile, enabled, updated_at)
    values (uid, coalesce(p_profile, '{}'::jsonb), true, now())
  on conflict (user_id) do update
    set profile = coalesce(excluded.profile, public.ai_user_profile.profile), updated_at = now();
end; $$;

create or replace function public.set_ai_memory_enabled(p_enabled boolean)
returns void language plpgsql security definer set search_path to 'public', 'auth' as $$
declare uid uuid;
begin
  uid := auth.uid();
  if uid is null then raise exception 'not authenticated'; end if;
  insert into public.ai_user_profile (user_id, enabled, updated_at)
    values (uid, coalesce(p_enabled, true), now())
  on conflict (user_id) do update set enabled = excluded.enabled, updated_at = now();
end; $$;

create or replace function public.reset_ai_profile()
returns void language plpgsql security definer set search_path to 'public', 'auth' as $$
declare uid uuid;
begin
  uid := auth.uid();
  if uid is null then raise exception 'not authenticated'; end if;
  update public.ai_user_profile set profile = '{}'::jsonb, updated_at = now() where user_id = uid;
end; $$;

-- ACL: grant to authenticated; revoke from anon + public, then VERIFY with
-- has_function_privilege('anon', …) — the bare revoke needed a re-apply (gotcha).
grant execute on function public.upsert_ai_profile(jsonb)     to authenticated;
grant execute on function public.set_ai_memory_enabled(boolean) to authenticated;
grant execute on function public.reset_ai_profile()          to authenticated;
revoke execute on function public.upsert_ai_profile(jsonb)     from anon, public;
revoke execute on function public.set_ai_memory_enabled(boolean) from anon, public;
revoke execute on function public.reset_ai_profile()          from anon, public;
