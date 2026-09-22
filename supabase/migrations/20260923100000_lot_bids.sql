-- Farmer's bids screen (SPEC.md §4.12, §5.3, §9.2 Phase 3 "3.5"). The farmer
-- must see the buyer's business name to decide, but buyer_kyc is
-- select-own + admin-only and carries gst_number/pan_last4 in the same row
-- (20260922120000_buyer_kyc.sql's DPDP comment) - widening that RLS would
-- hand every farmer a bidder's tax IDs. One security definer function
-- returning exactly the four fields this screen needs is the smaller, safer
-- diff, same shape as place_bid.
--
-- Rejecting needs no function: a narrow update policy + column grant, the
-- same "grants, not trust" shape buyer_kyc's admin approve already uses.

create function lot_bids(p_lot_id uuid)
returns table (
  bid_id uuid,
  price_per_quintal_paise bigint,
  created_at timestamptz,
  buyer_name text,
  buyer_verified boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- One error for "no such lot" and "not yours" - a probe can't tell them
  -- apart (same reasoning as place_bid's single BUYER_NOT_VERIFIED).
  if not exists (
    select 1 from lots where id = p_lot_id and farmer_id = auth.uid ()
  ) then
    raise exception 'LOT_NOT_FOUND';
  end if;

  return query
  select b.id, b.price_per_quintal_paise, b.created_at,
         k.business_name, (k.status = 'verified')
  from bids b
  join buyer_kyc k on k.buyer_id = b.buyer_id
  where b.lot_id = p_lot_id and b.status = 'active'
  order by b.price_per_quintal_paise desc, b.created_at desc;
end;
$$;

revoke all on function lot_bids (uuid) from public, anon;

grant execute on function lot_bids (uuid) to authenticated;

-- A farmer says no to an offer on their own lot. The lot_id join makes this
-- a no-op for mega-lot bids (lot_id is null there - SPEC §5.3 leaves
-- mega-lot accept/reject to the FPO, still a gap 3.4 documented). `with
-- check` only allows landing on 'rejected', so a farmer can never flip a
-- bid to 'accepted' themselves - that stays accept_bid's job (3.6).
create policy bids_reject_own_lot on bids
  for update to authenticated
  using (
    status = 'active'
    and exists (select 1 from lots l where l.id = bids.lot_id and l.farmer_id = auth.uid ())
  )
  with check (status = 'rejected');

grant update (status) on bids to authenticated;
