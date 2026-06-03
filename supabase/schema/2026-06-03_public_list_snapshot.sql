-- 2026-06-03 — get_public_list returns each item's listing_snapshot.
--
-- Why: the list-share receive surface (ListReceiver) resolved cover images
-- by joining listingId against the recipient's LIVE feed — so any item no
-- longer in the feed (sold + archived, reference-guide saves, articles)
-- rendered the 🗂 "List preview" placeholder and the recipient had nothing
-- to view (P-23, Mark 2026-06-03). collection_items has carried the full
-- listing_snapshot since 2026-05-01; the challenge RPC
-- (get_public_challenge) already returns it as 'snapshot' — this brings
-- the list RPC to parity. Additive: same row shape + one new key, so the
-- deployed SPA (which ignores unknown keys) is unaffected until the
-- receiver JS ships.

create or replace function public.get_public_list(list_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  c record;
  items jsonb;
begin
  -- Fetch the list row. Gate on type=free-form (regular user list);
  -- system + challenge + shared-inbox rows return null so the
  -- recipient SPA can render a clean "this list isn't shareable"
  -- state instead of leaking system-list contents.
  select id, name, user_id, type, is_system, is_shared_inbox,
         created_at, updated_at
    into c
    from public.collections
    where id = list_id
      and type = 'free-form'
      and is_system is not true
      and (is_shared_inbox is null or is_shared_inbox = false);
  if not found then
    return null;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'rowId',          ci.id,
    'listingId',      ci.listing_id,
    'savedPrice',     ci.saved_price,
    'savedCurrency',  ci.saved_currency,
    'savedPriceUSD',  ci.saved_price_usd,
    'addedAt',        ci.added_at,
    'isManual',       coalesce(ci.is_manual, false),
    -- Manual snapshot (null on listing-backed rows; ManualItemCard
    -- on the recipient handles whichever is populated).
    'manualImageUrl',     ci.manual_image_url,
    'manualBrand',        ci.manual_brand,
    'manualModel',        ci.manual_model,
    'manualReference',    ci.manual_reference,
    'manualMaterial',     ci.manual_material,
    'manualPricePaid',    ci.manual_price_paid,
    'manualPriceCurrency',ci.manual_price_currency,
    'manualSoldPrice',    ci.manual_sold_price,
    'manualSoldDate',     ci.manual_sold_date,
    'manualComments',     ci.manual_comments,
    'manualSourceUrl',    ci.manual_source_url,
    -- 2026-06-03: the listing payload at save time — lets the receive
    -- surface render covers + a view grid without a live-feed join
    -- (same key name as get_public_challenge).
    'snapshot',           ci.listing_snapshot
  ) order by ci.added_at), '[]'::jsonb)
    into items
    from public.collection_items ci
    where ci.collection_id = list_id;

  return jsonb_build_object(
    'id',         c.id,
    'name',       c.name,
    'ownerId',    c.user_id,
    'createdAt',  c.created_at,
    'updatedAt',  c.updated_at,
    'items',      items
  );
end;
$$;

grant execute on function public.get_public_list(uuid) to anon, authenticated;
