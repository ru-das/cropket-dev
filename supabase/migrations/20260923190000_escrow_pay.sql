-- fund_escrow() + buyer_deals() (SPEC.md §2.2, §4.14, §5.3, §5.4, §5.7,
-- §9.2 Phase 4 "4.3"). The first thing that moves an escrow out of
-- CREATED: escrow-pay (mock mode) and cashfree-webhook (real mode) both
-- call fund_escrow() with the service role, same "one function moves
-- money" shape escrow_transition() already set. 4.1's own header said
-- cashfree_order_id would land here.
--
-- fund_escrow() writes the escrow's first Khata row too - CLAUDE.md §4
-- gives escrow moves to Postgres functions, and a khata_entries insert is
-- part of the same all-or-nothing move as the state change, not a
-- separate step an Edge Function could do half of.
alter table escrows add column cashfree_order_id text unique;

create function fund_escrow(p_order_id text, p_payment_ref text, p_amount_paise bigint)
returns escrows
language plpgsql
security definer
set search_path = public
as $$
declare
  e        escrows;
  v_deal   deals;
begin
  select * into e from escrows where cashfree_order_id = p_order_id for update;
  if not found then
    raise exception 'ESCROW_NOT_FOUND';
  end if;

  -- Idempotent repeat: a retried webhook call (Cashfree's own retry, or a
  -- second escrow-pay tap after the first already went through) must not
  -- throw or write a second Khata row - it returns the row unchanged.
  if e.state <> 'CREATED' then
    return e;
  end if;

  if p_amount_paise <> e.total_paise then
    raise exception 'AMOUNT_MISMATCH';
  end if;

  select * into v_deal from deals where id = e.deal_id;

  -- ponytail: a mega-lot deal (deals.lot_id null) has no single farmer to
  -- credit - escrow_pay/cashfree-webhook can't reach one yet (3.4/3.5's
  -- still-open gap: no mega lot has ever gotten this far), so this is
  -- dead code today, not a shipped limitation. Upgrade path: one
  -- khata_entries row per mega_lot_items farmer, split by quantity_kg,
  -- same split.ts will do for release.
  if v_deal.lot_id is null then
    raise exception 'NOT_IMPLEMENTED mega_lot_deal';
  end if;

  e := escrow_transition(e.id, 'FUNDED', 'cashfree_payment ' || p_payment_ref, null);

  insert into khata_entries (user_id, deal_id, amount_paise, colour, title_key, title_values)
  select l.farmer_id, v_deal.id, v_deal.total_paise, 'yellow', 'khata.moneyLocked',
         jsonb_build_object('crop', l.crop, 'quantityKg', v_deal.quantity_kg)
  from lots l where l.id = v_deal.lot_id;

  return e;
end;
$$;

revoke all on function fund_escrow(text, text, bigint) from public, anon, authenticated;

grant execute on function fund_escrow(text, text, bigint) to service_role;

-- The buyer's own deals, for BuyerHome's "My deals" list and the pay
-- screen (SPEC §4.14) - same reason lot_bids() (3.5) exists instead of a
-- direct RLS policy: deals_select_party already reads `lots`, so a `lots`
-- policy reading `deals` back would be "infinite recursion in policy".
-- security definer + auth.uid() (never a p_buyer_id argument) is what
-- keeps this select-own instead of select-any.
create function buyer_deals()
returns table (
  deal_id uuid,
  escrow_id uuid,
  escrow_state escrow_state,
  escrow_total_paise bigint,
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
    d.id, es.id, es.state, es.total_paise,
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
