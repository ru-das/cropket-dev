-- Escrow tables + escrow_transition() (SPEC.md §5.3, §5.6, §5.7, §9.2
-- Phase 4 "4.1"). This is the money foundation the rest of M4 builds on:
-- `escrows`/`escrow_events`/`payouts`/`khata_entries` and the one function
-- allowed to move an escrow between states. accept_bid (3.6) creates a
-- deal but no escrow yet - 20260923180000_accept_bid_escrow.sql reopens it
-- right after this file to fix that.
--
-- Columns left out on purpose, added by the item that first needs them:
-- `otp_hash`/`otp_tries` -> 4.5 (delivery OTP), `cashfree_order_id` -> 4.3
-- (mock pay + webhook). Adding a column later is its own migration, same
-- pattern `20260922170000_mega_lots.sql` used for `fpo_id`.
create type escrow_state as enum (
  'CREATED', 'FUNDED', 'CANCELLED', 'REFUNDED',
  'DRIVER_ADVANCE_PAID', 'IN_TRANSIT', 'DELIVERED', 'DISPUTED',
  'RELEASED', 'PARTIAL_RELEASED'
);

create type khata_colour as enum ('yellow', 'blue', 'green', 'red');

-- One escrow per deal - structural (unique), same reasoning
-- `deals_lot_id_key` gave one deal per lot.
create table escrows (
  id uuid primary key default gen_random_uuid (),
  deal_id uuid not null unique references deals (id),
  total_paise bigint not null check (total_paise > 0),
  state escrow_state not null default 'CREATED',
  delivered_at timestamptz,
  auto_release_at timestamptz,
  created_at timestamptz not null default now (),
  updated_at timestamptz not null default now ()
);

alter table escrows enable row level security;

revoke all on escrows from anon, authenticated;

grant select on escrows to authenticated;

-- Reuses deals' own party rule instead of copying it - whoever can see the
-- deal (farmer or buyer, deals_select_party) can see its escrow.
create policy escrows_select_party on escrows
  for select to authenticated
  using (exists (select 1 from deals where deals.id = escrows.deal_id));

-- Config, not demo data: the allowed moves from SPEC §5.7's table. Read by
-- escrow_transition() below, never by the app.
create table escrow_transitions (
  from_state escrow_state not null,
  to_state escrow_state not null,
  primary key (from_state, to_state)
);

alter table escrow_transitions enable row level security;

revoke all on escrow_transitions from anon, authenticated;

insert into escrow_transitions (from_state, to_state) values
  ('CREATED', 'FUNDED'),
  ('CREATED', 'CANCELLED'),
  ('FUNDED', 'DRIVER_ADVANCE_PAID'),
  ('FUNDED', 'IN_TRANSIT'),
  ('FUNDED', 'REFUNDED'),
  ('DRIVER_ADVANCE_PAID', 'IN_TRANSIT'),
  ('IN_TRANSIT', 'DELIVERED'),
  ('IN_TRANSIT', 'DISPUTED'),
  ('DELIVERED', 'RELEASED'),
  ('DELIVERED', 'DISPUTED'),
  ('DISPUTED', 'RELEASED'),
  ('DISPUTED', 'PARTIAL_RELEASED'),
  ('DISPUTED', 'REFUNDED');

-- Insert-only, even for the service role - a permanent audit trail of
-- every escrow move (Phase 4 "Done when": "every step is in
-- escrow_events"). No trigger needed: the revoke alone blocks it.
create table escrow_events (
  id uuid primary key default gen_random_uuid (),
  escrow_id uuid not null references escrows (id),
  from_state escrow_state, -- null only for the creation row
  to_state escrow_state not null,
  reason text,
  actor uuid references profiles (id),
  created_at timestamptz not null default now ()
);

alter table escrow_events enable row level security;

revoke all on escrow_events from anon, authenticated, service_role;

grant insert, select on escrow_events to service_role;

create table payouts (
  id uuid primary key default gen_random_uuid (),
  escrow_id uuid not null references escrows (id),
  to_user uuid not null references profiles (id),
  amount_paise bigint not null check (amount_paise > 0),
  type text not null check (
    type in ('farmer_share', 'driver_advance', 'driver_freight', 'emi', 'platform_fee', 'refund')
  ),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed')),
  provider_ref text,
  created_at timestamptz not null default now ()
);

alter table payouts enable row level security;

revoke all on payouts from anon, authenticated;

-- The colour-coded passbook (SPEC §4.15). 4.3/4.6/4.8 write rows here as
-- FUNDED/IN_TRANSIT/RELEASED happen - this migration only creates the table.
create table khata_entries (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references profiles (id),
  deal_id uuid not null references deals (id),
  amount_paise bigint not null,
  colour khata_colour not null,
  title_key text not null,
  title_values jsonb not null default '{}',
  created_at timestamptz not null default now ()
);

alter table khata_entries enable row level security;

revoke all on khata_entries from anon, authenticated;

grant select on khata_entries to authenticated;

create policy khata_select_own on khata_entries
  for select to authenticated
  using (user_id = auth.uid ());

-- The only way escrow state changes (SPEC §5.7, CLAUDE.md §3 "Key rules").
-- security definer + service-role-only grant: users never call this
-- directly, only Edge Functions (with the service role) and small wrapper
-- RPCs that check who's calling first (SPEC §5.7's own note).
create function escrow_transition(
  p_escrow uuid, p_to escrow_state, p_reason text, p_actor uuid default null
) returns escrows
language plpgsql security definer set search_path = public as $$
declare
  e         escrows;
  old_state escrow_state;
begin
  select * into e from escrows where id = p_escrow for update;   -- row lock
  if not found then raise exception 'ESCROW_NOT_FOUND'; end if;
  old_state := e.state;
  if old_state = p_to then return e; end if;                       -- idempotent repeat
  if not exists (select 1 from escrow_transitions
                 where from_state = old_state and to_state = p_to) then
    raise exception 'ILLEGAL_TRANSITION % -> %', old_state, p_to;
  end if;

  update escrows
     set state           = p_to,
         updated_at      = now(),
         delivered_at    = case when p_to = 'DELIVERED' then now() else delivered_at end,
         auto_release_at = case when p_to = 'DELIVERED' then now() + interval '24 hours'
                                else auto_release_at end
   where id = p_escrow
  returning * into e;

  insert into escrow_events (escrow_id, from_state, to_state, reason, actor)
  values (p_escrow, old_state, p_to, p_reason, p_actor);

  return e;
end $$;

revoke all on function escrow_transition(uuid, escrow_state, text, uuid)
  from public, anon, authenticated;   -- only the service role may move money

grant execute on function escrow_transition(uuid, escrow_state, text, uuid) to service_role;
