-- Tests for the auto-settle pg_cron schedule (SPEC.md §5.2, §5.7, §8.2,
-- §9.2 Phase 4 "4.9"). Same shape as cron_fetch_prices.sql. Everything
-- here rolls back.
begin;
select plan(3);

-- 1. Function trigger_cron_auto_settle() exists
select has_function(
  'public',
  'trigger_cron_auto_settle',
  ARRAY[]::text[],
  'trigger_cron_auto_settle() function exists'
);

-- 2. anon role cannot execute trigger_cron_auto_settle()
select throws_ok(
  $$
    set local role anon;
    select public.trigger_cron_auto_settle();
  $$,
  '42501',
  null,
  'anon cannot execute trigger_cron_auto_settle()'
);

-- Reset role to postgres
reset role;

-- 3. auto-settle job scheduled every 15 minutes and active
select results_eq(
  $$
    select schedule, active
    from cron.job
    where jobname = 'auto-settle';
  $$,
  $$
    values ('*/15 * * * *'::text, true);
  $$,
  'auto-settle job exists with schedule */15 * * * * and is active'
);

select * from finish(true);
rollback;
