-- Adds auto_release_at to buyer_deals() (SPEC.md §5.4, §9.2 Phase 4 "4.9"),
-- for BuyerDealPage's Countdown once the escrow is DELIVERED. A changed
-- return type can't use `create or replace function` - drop first.
drop function buyer_deals();

create function buyer_deals()
returns table (
  deal_id uuid,
  escrow_id uuid,
  escrow_state escrow_state,
  escrow_total_paise bigint,
  auto_release_at timestamptz,
  lot_id uuid,
  crop text,
  grade text,
  qr_code text,
  quantity_kg integer,
  price_per_quintal_paise bigint,
  total_paise bigint,
  fee_paise bigint,
  pickup_date date
)
language sql
security definer
set search_path = public
stable
as $$
  select
    d.id, es.id, es.state, es.total_paise, es.auto_release_at,
    l.id, l.crop, l.grade, l.qr_code,
    d.quantity_kg, d.price_per_quintal_paise, d.total_paise, d.fee_paise, d.pickup_date
  from deals d
  join escrows es on es.deal_id = d.id
  join lots l on l.id = d.lot_id
  where d.buyer_id = auth.uid()
  order by d.created_at desc;
$$;

revoke all on function buyer_deals() from public, anon;

grant execute on function buyer_deals() to authenticated;
