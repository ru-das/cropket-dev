-- profiles: one row per logged-in person (SPEC.md §5.6). Every later table's
-- RLS policy reads role/kyc_status/banned from here, so the full column set
-- is created now even though most of it is only used starting M1-M4.
-- Farmers, buyers and FPOs insert their own row at role pick (0.5 onboarding).
-- Admin/nbfc accounts are made by the team by hand (SPEC.md §4.3) - the
-- insert policy below blocks anyone from picking those roles themselves.

create type user_role as enum ('farmer', 'buyer', 'fpo', 'admin', 'nbfc');

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  -- read from the verified JWT, not the request body - a client can never
  -- claim someone else's phone number.
  phone text not null default (auth.jwt() ->> 'phone'),
  name text,
  role user_role not null,
  language text not null default 'mr' check (language in ('en', 'hi', 'mr')),
  village text,
  district text,
  state text,
  location geography (point, 4326),
  kyc_status text not null default 'pending' check (kyc_status in ('pending', 'verified', 'rejected')),
  trust_score numeric not null default 0,
  strikes integer not null default 0,
  banned boolean not null default false,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy profiles_select_own on profiles
  for select to authenticated
  using (id = auth.uid ());

create policy profiles_insert_own on profiles
  for insert to authenticated
  with check (id = auth.uid () and role in ('farmer', 'buyer', 'fpo'));

create policy profiles_update_own on profiles
  for update to authenticated
  using (id = auth.uid ())
  with check (id = auth.uid ());

-- Column grants instead of a trigger: role/kyc_status/trust_score/strikes/
-- banned/phone are readable but never writable by the logged-in user, so a
-- policy check is never the only thing standing between a farmer and
-- `role = 'admin'`. The service role (used by seed, demo-reset, and admin
-- Edge Functions) bypasses RLS and these grants entirely.
revoke all on profiles from anon, authenticated;

grant select on profiles to authenticated;

grant insert (
  id, name, role, language, village, district, state, location
) on profiles to authenticated;

grant update (
  name, language, village, district, state, location
) on profiles to authenticated;
