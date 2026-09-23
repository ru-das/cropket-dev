-- "Mark dispatched" (SPEC.md §4.15, §5.3, §5.6, §5.7, §9.2 Phase 4 "4.6").
-- The farmer's own move from FUNDED to IN_TRANSIT - the "simple dispatch"
-- row escrow_transitions already carries (4.1), used until full logistics
-- (shipments-create + trip, Phase 5) replaces it. Same "one function, one
-- transaction" shape fund_escrow() (4.3) set: escrow_transition() plus one
-- khata_entries row, so the state move and the passbook row can never
-- happen one without the other.
--
-- ponytail: SPEC §5.3 originally gated this on ALLOW_SIMPLE_DISPATCH, an
-- Edge Function secret - a SQL function can't read Deno.env, and the flag
-- stays true until Phase 5 logistics exists, which is out of prototype
-- scope. So this function has no flag check at all; SPEC.md is updated in
-- this same change to say so. Upgrade path: if Phase 5 ever needs to turn
-- simple dispatch off, move the flag into app_config (SPEC §5.6) and check
-- it here, the same way a second reason moved v_fee_bps there.
create function mark_dispatched(p_escrow_id uuid)
returns escrow_state
language plpgsql
security definer
set search_path = public
as $$
declare
  v_farmer_id uuid := auth.uid();
  e           escrows;
  v_deal      deals;
begin
  if v_farmer_id is null then
    raise exception 'NOT_SIGNED_IN';
  end if;

  select * into e from escrows where id = p_escrow_id for update;
  if not found then
    raise exception 'ESCROW_NOT_FOUND';
  end if;

  select * into v_deal from deals where id = e.deal_id;

  -- One error for "no such escrow" and "not your lot" - a probe can't tell
  -- them apart, same reasoning accept_bid's LOT_NOT_FOUND gives. A mega-lot
  -- deal (lot_id null) also has no single farmer.lot_id to own it - it's
  -- NOT_IMPLEMENTED, not "not yours".
  if v_deal.lot_id is null then
    raise exception 'NOT_IMPLEMENTED mega_lot_deal';
  end if;
  if not exists (select 1 from lots where id = v_deal.lot_id and farmer_id = v_farmer_id) then
    raise exception 'ESCROW_NOT_FOUND';
  end if;

  -- Idempotent repeat: a retry after a network blip must not error the
  -- farmer out - same shape fund_escrow()'s "state <> CREATED" branch uses.
  if e.state = 'IN_TRANSIT' then
    return e.state;
  end if;

  if e.state <> 'FUNDED' then
    raise exception 'ESCROW_WRONG_STATE';
  end if;

  e := escrow_transition(e.id, 'IN_TRANSIT', 'mark_dispatched', v_farmer_id);

  insert into khata_entries (user_id, deal_id, amount_paise, colour, title_key, title_values)
  select v_farmer_id, v_deal.id, v_deal.total_paise, 'blue', 'khata.onTheWay',
         jsonb_build_object('crop', l.crop, 'quantityKg', v_deal.quantity_kg)
  from lots l where l.id = v_deal.lot_id;

  return e.state;
end;
$$;

revoke all on function mark_dispatched(uuid) from public, anon;

grant execute on function mark_dispatched(uuid) to authenticated;
