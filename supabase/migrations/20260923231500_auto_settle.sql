-- Schedules the 24h auto-release timer (SPEC.md §5.2, §5.7, §8.2, §9.2
-- Phase 4 "4.9"). escrow_transition() (4.1) already sets
-- auto_release_at = now() + 24h whenever an escrow reaches DELIVERED;
-- nothing has read that column until now. Every 15 minutes,
-- cron-auto-settle releases every DELIVERED escrow whose timer has passed
-- with no open dispute (Phase 5 - "no open dispute" is the same as
-- "still DELIVERED": a DISPUTED escrow never matches the cron's query, and
-- release_escrow() (4.8) refuses anything that isn't DELIVERED anyway).

-- Helper function invoked by pg_cron to call the cron-auto-settle Edge
-- Function via pg_net - same shape as trigger_cron_fetch_prices()
-- (20260919161110_cron_fetch_prices.sql).
create or replace function public.trigger_cron_auto_settle()
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
    raise warning 'cron-auto-settle skipped: functions_url or cron_secret not found in vault';
    return null;
  end if;

  select net.http_post(
    url := v_url || '/cron-auto-settle',
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

revoke all on function public.trigger_cron_auto_settle() from public, anon, authenticated;
grant execute on function public.trigger_cron_auto_settle() to postgres, service_role;

-- Ensure idempotent scheduling
do $$
begin
  if exists (select 1 from cron.job where jobname = 'auto-settle') then
    perform cron.unschedule('auto-settle');
  end if;
end $$;

-- Every 15 minutes (SPEC §8.2)
select cron.schedule(
  'auto-settle',
  '*/15 * * * *',
  $$select public.trigger_cron_auto_settle();$$
);
