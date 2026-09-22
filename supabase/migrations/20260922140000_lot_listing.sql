-- Lets a farmer list their own lot for sale (SPEC.md §4.7 "Sell on Cropket",
-- §9.2 Phase 3 "3.2"). Until now `lots` had no update grant at all - the
-- original migration's comment says "nothing changes a lot's status until
-- 3.2". This is that change: a single-row update, not an RPC, because
-- listing is not an all-or-nothing multi-table change (AGENTS.md §3 reserves
-- supabase.rpc() for place_bid/accept_bid/escrow, which are).
--
-- The using/with check pair is the whole state rule, enforced by Postgres,
-- not just the UI: only your own row, only draft -> listed, and only when
-- it already has a grade (decided with the user - an ungraded lot in the
-- marketplace would make the grade filter meaningless). Un-listing back to
-- draft is not granted - nothing in M3 needs it yet.
create policy lots_update_own_list on lots
  for update to authenticated
  using (farmer_id = auth.uid () and status = 'draft')
  with check (farmer_id = auth.uid () and status = 'listed' and grade is not null);

grant update (status) on lots to authenticated;
