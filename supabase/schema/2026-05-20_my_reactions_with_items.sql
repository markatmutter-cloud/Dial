-- 2026-05-20 — My-reactions virtual list (PR_K).
--
-- Surfaces every reaction the calling user has placed across every
-- list they have access to, joined with the underlying item snapshot
-- so the frontend can render a "My reactions" drill-in inside
-- Collections > Lists without round-trips per item.
--
-- Mark spec 2026-05-20: "the reactions to shared lists and auction
-- catalogs with thumbs up and down [are] not easy to find and review
-- (forgot that I had reviews most of those things and might not have
-- got them right)." This RPC backs a synthetic row alongside Saved /
-- Hidden / Shared so the user can audit their own sentiment history
-- in one place before re-running the collector profile analysis.
--
-- Security model:
--   - SECURITY DEFINER for the same reason as `list_item_reactions`
--     (single round-trip with joins across reactions / items /
--     collections). Internal filter pins to auth.uid().
--   - Returns only the caller's own reactions — no cross-user reads.
--   - Item snapshot fields (listing_snapshot jsonb + manual_*) come
--     from `collection_items`, which the caller already has SELECT
--     access to wherever they have a reaction (they can only react
--     on items in collections they can view).
--
-- The function is read-only / `stable`. No INSERT / UPDATE / DELETE
-- happens inside; mutations route through the existing
-- toggleReaction path that uses the regular collection_item_reactions
-- table policies.

create or replace function public.my_reactions_with_items()
returns table (
  reaction_id        uuid,
  emoji              text,
  reacted_at         timestamptz,
  collection_item_id uuid,
  collection_id      uuid,
  collection_name    text,
  collection_type    text,
  listing_id         text,
  listing_snapshot   jsonb,
  is_manual          boolean,
  manual_brand       text,
  manual_model       text,
  manual_reference   text,
  manual_image_url   text,
  manual_price_paid  numeric,
  manual_price_currency text,
  saved_price        numeric,
  saved_currency     text,
  saved_price_usd    numeric,
  cached_img_url     text,
  added_at           timestamptz
)
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then return; end if;
  return query
    select r.id,
           r.emoji,
           r.created_at,
           ci.id,
           ci.collection_id,
           c.name,
           c.type,
           ci.listing_id,
           ci.listing_snapshot,
           ci.is_manual,
           ci.manual_brand,
           ci.manual_model,
           ci.manual_reference,
           ci.manual_image_url,
           ci.manual_price_paid,
           ci.manual_price_currency,
           ci.saved_price,
           ci.saved_currency,
           ci.saved_price_usd,
           ci.cached_img_url,
           ci.added_at
      from public.collection_item_reactions r
      join public.collection_items ci on ci.id = r.collection_item_id
      join public.collections      c  on c.id  = ci.collection_id
     where r.user_id = uid
     order by r.created_at desc;
end;
$$;

-- ACL note (revised 2026-05-20):
-- The CLAUDE.md "Supabase public schema default ACL gotcha" note
-- says new functions get EXECUTE via PUBLIC, so `revoke from public`
-- is the lever. On the CURRENT platform that's no longer accurate —
-- new functions in `public` get DIRECT EXECUTE grants to anon,
-- authenticated, and service_role. `revoke from public` is a no-op
-- because PUBLIC never held the grant in the first place. To
-- actually block anon you have to `revoke … from anon` directly.
-- Verified by `information_schema.routine_privileges` after creation.
grant execute on function public.my_reactions_with_items() to authenticated;
revoke execute on function public.my_reactions_with_items() from anon;
