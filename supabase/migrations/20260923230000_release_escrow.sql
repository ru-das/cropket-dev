-- release_escrow() (SPEC.md §5.3, §5.4, §5.6, §5.7, §9.2 Phase 4 "4.8").
-- The last P0 money step: a correct delivery code (4.7's `trip` `POST
-- /otp`) or 4.9's 24 h timer calls this, via the shared `_shared/
-- release.ts` module (not a deployed Edge Function - it has no HTTP
-- caller of its own, only other server-side code), to turn a DELIVERED
-- escrow into RELEASED + `payouts` rows + a green Khata row. Same "one
-- function, one transaction" shape record_pod()/fund_escrow()/
-- mark_dispatched() already use.
--
-- The payout lines themselves come from `_shared/domain/split.ts` (4.2) -
-- this function only turns the lines it's handed into rows and checks
-- they add up to the escrow total (CLAUDE.md §5 "Money (fail closed)").
-- It doesn't call split.ts itself (a SQL function can't import TypeScript)
-- - release.ts does that and passes the result in as jsonb.

-- The platform fee has no profiles row to point at - to_user is null only
-- for that one payout type, never for a farmer_share (a farmer share with
-- no farmer would be a silent money leak, not a valid row).
alter table payouts alter column to_user drop not null;

alter table payouts add constraint payouts_to_user_required check (
  to_user is not null or type = 'platform_fee'
);

create function release_escrow(
  p_escrow uuid, p_reason text, p_payouts jsonb, p_provider_ref text
) returns escrows
language plpgsql
security definer
set search_path = public
as $$
declare
  e      escrows;
  v_deal deals;
  v_sum  bigint;
begin
  select * into e from escrows where id = p_escrow for update;
  if not found then
    raise exception 'ESCROW_NOT_FOUND';
  end if;

  -- Idempotent repeat: SPEC §5.7's own test requirement is "two parallel
  -- releases give one release" - the OTP path and 4.9's 24h timer could
  -- both fire for the same escrow. The row lock above serialises them; the
  -- second to arrive sees RELEASED already and returns unchanged, same
  -- shape every other money function's repeat branch uses.
  if e.state = 'RELEASED' then
    return e;
  end if;

  -- Also covers "the timer must not release a DISPUTED escrow" (SPEC
  -- §5.7's test list) - DISPUTED -> RELEASED is a real row in
  -- escrow_transitions (admin resolution, Phase 5/P1), but this function
  -- only ever releases from DELIVERED. An open dispute is refused here,
  -- not by escrow_transition() itself.
  if e.state <> 'DELIVERED' then
    raise exception 'ESCROW_WRONG_STATE';
  end if;

  select * into v_deal from deals where id = e.deal_id;

  -- ponytail: same gap fund_escrow()/mark_dispatched()/record_pod() all
  -- carry - a mega-lot deal (lot_id null) has no single farmer to credit,
  -- and no mega-lot deal has ever reached DELIVERED yet (3.4/3.5's
  -- still-open gap). Dead code today. Upgrade path: split.ts already
  -- takes a farmers[] array - release.ts would build one line per
  -- mega_lot_items farmer instead of one.
  if v_deal.lot_id is null then
    raise exception 'NOT_IMPLEMENTED mega_lot_deal';
  end if;

  -- Fail closed (CLAUDE.md §5): if the payout lines release.ts computed
  -- don't sum to exactly what the escrow holds, write nothing.
  select coalesce(sum((line ->> 'amountPaise')::bigint), 0)
    into v_sum
  from jsonb_array_elements(p_payouts) as line;
  if v_sum <> e.total_paise then
    raise exception 'SPLIT_MISMATCH';
  end if;

  e := escrow_transition(e.id, 'RELEASED', p_reason, null);

  insert into payouts (escrow_id, to_user, amount_paise, type, status, provider_ref)
  select
    e.id,
    nullif(line ->> 'farmerId', '')::uuid,
    (line ->> 'amountPaise')::bigint,
    line ->> 'type',
    'paid',
    p_provider_ref
  from jsonb_array_elements(p_payouts) as line;

  -- One green Khata row per farmer_share line (a mega lot pays several
  -- farmers; a single lot pays one) - never for the platform_fee line,
  -- which isn't the farmer's money.
  insert into khata_entries (user_id, deal_id, amount_paise, colour, title_key, title_values)
  select
    (line ->> 'farmerId')::uuid, v_deal.id, (line ->> 'amountPaise')::bigint, 'green', 'khata.received',
    jsonb_build_object('crop', l.crop, 'quantityKg', v_deal.quantity_kg)
  from jsonb_array_elements(p_payouts) as line
  join lots l on l.id = v_deal.lot_id
  where line ->> 'type' = 'farmer_share';

  return e;
end;
$$;

revoke all on function release_escrow(uuid, text, jsonb, text) from public, anon, authenticated;

grant execute on function release_escrow(uuid, text, jsonb, text) to service_role;
