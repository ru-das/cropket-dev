-- grade_results: one row per scan (SPEC.md §5.6, §5.1 Phase 1). The `grade`
-- Edge Function (1.3) is the only writer - it upserts the `pending` row
-- itself with the service role, using the id the phone made in Dexie, then
-- fills in the grade once the AI service answers. So there is no insert or
-- update policy for `authenticated` here, same shape as `profiles`
-- (20260916164928_profiles.sql): select-your-own only.
create table grade_results (
  id uuid primary key,
  farmer_id uuid not null references profiles (id) on delete cascade,
  crop text not null check (crop in ('onion', 'tomato', 'potato')),
  status text not null default 'pending' check (status in ('pending', 'done', 'failed')),
  grade text check (grade in ('A', 'B', 'C')),
  -- 0-100, not 0-1 - matches SPEC.md §4.6 "AI is 82% sure" and §5.5
  -- "confidence -15" reading the same way in the DB, the AI service and the UI.
  confidence numeric check (confidence between 0 and 100),
  size_label text,
  colour_pct numeric,
  damage_pct numeric,
  photo_paths text[] not null,
  kind text not null default 'indicative' check (kind in ('indicative', 'assured')),
  needs_human_check boolean not null default false,
  -- 'mock' | 'ai' - lets 1.5's <DemoDataTag> know when a grade isn't real yet.
  source text check (source in ('mock', 'ai')),
  client_created_at timestamptz,
  created_at timestamptz not null default now()
);

create index grade_results_farmer_created_idx on grade_results (farmer_id, created_at desc);

alter table grade_results enable row level security;

create policy grade_results_select_own on grade_results
  for select to authenticated
  using (farmer_id = auth.uid ());

-- No insert/update/delete grant for authenticated - only the service role
-- (used inside the `grade` function) ever writes this table.
revoke all on grade_results from anon, authenticated;

grant select on grade_results to authenticated;
