-- Tests for cron-fetch-prices scheduled jobs (SPEC.md §5.4, §8.2).
-- Verifies the pg_cron schedule and trigger_cron_fetch_prices function.
-- Everything here rolls back.
begin;
select plan(5);

-- 1. Function trigger_cron_fetch_prices() exists
select has_function(
  'public',
  'trigger_cron_fetch_prices',
  ARRAY[]::text[],
  'trigger_cron_fetch_prices() function exists'
);

-- 2. anon role cannot execute trigger_cron_fetch_prices()
select throws_ok(
  $$
    set local role anon;
    select public.trigger_cron_fetch_prices();
  $$,
  '42501',
  null,
  'anon cannot execute trigger_cron_fetch_prices()'
);

-- Reset role to postgres
reset role;

-- 3. Daily primary job scheduled at 18:10 IST (12:40 UTC, '40 12 * * *')
select results_eq(
  $$
    select schedule, active
    from cron.job
    where jobname = 'fetch-prices-daily';
  $$,
  $$
    values ('40 12 * * *'::text, true);
  $$,
  'fetch-prices-daily job exists with schedule 40 12 * * * and is active'
);

-- 4. Daily retry job scheduled at 18:20 IST (12:50 UTC, '50 12 * * *')
select results_eq(
  $$
    select schedule, active
    from cron.job
    where jobname = 'fetch-prices-retry';
  $$,
  $$
    values ('50 12 * * *'::text, true);
  $$,
  'fetch-prices-retry job exists with schedule 50 12 * * * and is active'
);

-- 5. Retry query guard evaluates to false when a row for today exists
insert into mandis (id, name, location) values
  ('99999999-9999-9999-9999-999999999999', 'Guard Test Mandi', 'SRID=4326;POINT(74.0 20.0)')
on conflict (id) do nothing;

insert into mandi_prices (mandi_id, crop, date, min_price_paise, max_price_paise, modal_price_paise, arrivals_tonnes, source)
values (
  '99999999-9999-9999-9999-999999999999',
  'onion',
  (now() at time zone 'Asia/Kolkata')::date,
  150000, 200000, 180000,
  100,
  'seed'
)
on conflict (mandi_id, crop, date) do nothing;

select is_empty(
  $$
    select 1
    where not exists (
      select 1 from public.mandi_prices
      where date = (now() at time zone 'Asia/Kolkata')::date
    );
  $$,
  'Retry guard correctly evaluates to empty when today prices already exist'
);

select * from finish(true);
rollback;
