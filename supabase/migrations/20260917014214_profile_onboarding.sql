-- Onboarding fields for `profiles` (SPEC.md §4.3, §9.2 Phase 1 "1.1 chat-style
-- onboarding"). Adds the crops a farmer/FPO grows and defaults district/state
-- to the pilot area (Nashik, Maharashtra) so the floor-price district lookup
-- (SPEC.md §2.4) always has a value even before reverse geocoding exists.
-- village and location columns already exist and are already grantable
-- (20260916164928_profiles.sql) - only crops is new here.

alter table profiles add column crops text[] not null default '{}';

-- No "must pick at least one crop" check here on purpose: a check runs
-- against existing rows too, and a buyer's row is allowed to have none.
-- "farmer/FPO needs >= 1 crop" lives in zod (ProfileInput), checked before
-- the insert, not in the database.
alter table profiles add constraint profiles_crops_known
  check (crops <@ array['onion', 'tomato', 'potato']);

alter table profiles alter column district set default 'Nashik';
alter table profiles alter column state set default 'Maharashtra';

grant insert (crops) on profiles to authenticated;
grant update (crops) on profiles to authenticated;
