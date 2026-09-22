-- buyer_kyc: one row per buyer's KYC submission (SPEC.md §5.6, §9.2 Phase 3
-- "3.1"). `kyc-verify` (service role) is the only inserter - same
-- select-your-own-only shape as `grade_results`
-- (20260917023943_grade_results.sql). The admin approve screen is the one
-- exception: it needs to flip `status` from `pending` to `verified` /
-- `rejected` after a human looks at a mock result the adapter left pending,
-- so (unlike grade_results) authenticated also gets a narrow
-- `grant update (status)`, gated by an admin-only RLS policy below.
--
-- A never-store-the-real-document rule (DPDP, SPEC.md §10.1: "store
-- verified results and consent logs, not raw government documents") is why
-- this table has `pan_last4`, not `pan` - the full PAN never reaches disk.
create table buyer_kyc (
  buyer_id uuid primary key references profiles (id) on delete cascade,
  business_name text not null check (length(business_name) between 3 and 120),
  gst_number text not null,
  pan_last4 text not null check (pan_last4 ~ '^[0-9A-Z]{4}$'),
  status text not null default 'pending' check (status in ('pending', 'verified', 'rejected')),
  -- 'mock' | 'digilocker' - lets the KYC screen's <DemoDataTag> know when a
  -- verdict isn't real yet, same shape as grade_results.source.
  source text not null check (source in ('mock', 'digilocker')),
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

alter table buyer_kyc enable row level security;

create policy buyer_kyc_select_own on buyer_kyc
  for select to authenticated
  using (buyer_id = auth.uid ());

-- The admin queue and the approve/reject action. The subquery reads only
-- the caller's own profiles row (already permitted by profiles_select_own),
-- so this needs no helper function and no change to profiles' RLS.
create policy buyer_kyc_select_admin on buyer_kyc
  for select to authenticated
  using (exists (select 1 from profiles where id = auth.uid () and role = 'admin'));

create policy buyer_kyc_update_admin on buyer_kyc
  for update to authenticated
  using (exists (select 1 from profiles where id = auth.uid () and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid () and role = 'admin'));

revoke all on buyer_kyc from anon, authenticated;

grant select on buyer_kyc to authenticated;

-- Only `status` - an admin approves/rejects, never rewrites the submitted
-- business details. Insert has no grant at all: only the service role
-- (inside kyc-verify) ever creates a row.
grant update (status) on buyer_kyc to authenticated;

-- Keeps profiles.kyc_status (read everywhere else's RLS, e.g. place_bid in
-- 3.3) in sync with buyer_kyc.status in the same transaction, whichever
-- caller wrote the row - kyc-verify's service-role insert, or an admin's
-- column-grant update. One place does the sync instead of both callers
-- having to remember to. security definer so it can write profiles (the
-- caller only ever has a column grant on buyer_kyc.status, never on
-- profiles.kyc_status directly - same "grants, not trust" shape profiles'
-- own migration comment describes).
create function buyer_kyc_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.verified_at = case when new.status = 'verified' then now() else null end;
  update profiles set kyc_status = new.status where id = new.buyer_id;
  return new;
end;
$$;

create trigger buyer_kyc_sync_trigger
  before insert or update on buyer_kyc
  for each row
  execute function buyer_kyc_sync();
