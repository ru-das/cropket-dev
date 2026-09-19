-- Schedules automated daily top-up of mandi prices (SPEC.md §5.4, §8.2).
-- Mandi trading concludes and APMC officials report daily prices to Agmarknet
-- around 18:00 IST (12:30 UTC).
--
-- 1. Primary fetch: runs daily at 18:10 IST (12:40 UTC, '40 12 * * *').
-- 2. Retry fetch: runs daily at 18:20 IST (12:50 UTC, '50 12 * * *') ONLY IF
--    no price rows exist for today (Asia/Kolkata date), which handles cases where
--    upstream Agmarknet/data.gov.in was delayed, returned empty, or encountered an error.

-- Helper function invoked by pg_cron to call the cron-fetch-prices Edge Function via pg_net
create or replace function public.trigger_cron_fetch_prices()
returns bigint
language plpgsql
security definer
set search_path = public, vault, net
as $$
declare
  v_url text;
  v_secret text;
  v_request_id bigint;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'functions_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'cron_secret';

  if v_url is null or v_secret is null then
    raise warning 'cron-fetch-prices skipped: functions_url or cron_secret not found in vault';
    return null;
  end if;

  select net.http_post(
    url := v_url || '/cron-fetch-prices',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_secret
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  ) into v_request_id;

  return v_request_id;
end;
$$;

revoke all on function public.trigger_cron_fetch_prices() from public, anon, authenticated;
grant execute on function public.trigger_cron_fetch_prices() to postgres, service_role;

-- Ensure idempotent scheduling
do $$
begin
  if exists (select 1 from cron.job where jobname = 'fetch-prices-daily') then
    perform cron.unschedule('fetch-prices-daily');
  end if;
  if exists (select 1 from cron.job where jobname = 'fetch-prices-retry') then
    perform cron.unschedule('fetch-prices-retry');
  end if;
end $$;

-- Daily primary fetch at 18:10 IST (12:40 UTC)
select cron.schedule(
  'fetch-prices-daily',
  '40 12 * * *',
  $$select public.trigger_cron_fetch_prices();$$
);

-- Daily retry fetch at 18:20 IST (12:50 UTC) - only if no prices recorded for today
select cron.schedule(
  'fetch-prices-retry',
  '50 12 * * *',
  $$select public.trigger_cron_fetch_prices()
    where not exists (
      select 1 from public.mandi_prices
      where date = (now() at time zone 'Asia/Kolkata')::date
    );$$
);
