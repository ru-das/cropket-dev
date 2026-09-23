-- admin_delivered_escrows() (SPEC.md §5.2, §8.6, §9.2 Phase 4 "4.9") - the
-- admin queue AdminEscrowsPage reads, and escrow-skip-timer's own
-- authority check reuses the same "caller is admin" test. A function
-- instead of admin RLS on escrows/deals/lots (unlike buyer_kyc's inline
-- policy, SPEC §9.5's KYC precedent) because this needs one three-table
-- join, and adding admin-read policies to escrows/deals/lots individually
-- would be three separate policies for one screen; buyer_kyc's own
-- policies stay untouched.
create function admin_delivered_escrows()
returns table (
  escrow_id uuid,
  qr_code text,
  crop text,
  total_paise bigint,
  auto_release_at timestamptz
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not exists (select 1 from profiles where id = auth.uid() and role = 'admin') then
    raise exception 'FORBIDDEN';
  end if;

  return query
    select es.id, l.qr_code, l.crop, es.total_paise, es.auto_release_at
    from escrows es
    join deals d on d.id = es.deal_id
    join lots l on l.id = d.lot_id
    where es.state = 'DELIVERED'
    order by es.auto_release_at asc;
end;
$$;

revoke all on function admin_delivered_escrows() from public, anon;

grant execute on function admin_delivered_escrows() to authenticated;
