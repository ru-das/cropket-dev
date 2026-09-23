-- Delivery OTP lock (SPEC.md §4.14, §5.3, §5.6, §5.7, §9.2 Phase 4 "4.5").
--
-- No otp_hash column, on purpose - the delivery code is never stored at
-- all, hashed or otherwise. It's *derived*: 4 digits of
-- HMAC-SHA256(OTP_PEPPER, escrow_id) (`_shared/domain/deliveryOtp.ts`).
-- Anyone who can recompute that HMAC (the buyer's `delivery-code` function
-- today, 4.7's `trip` function later, both holding the same server-side
-- OTP_PEPPER) gets the same code back - no lookup needed, and a database
-- leak reveals nothing (there's no code or hash in it to leak). This is
-- stronger than SPEC §5.6's "otp_hash" column, which SPEC.md is updated in
-- this same change to reflect.
--
-- otp_tries is still a real column: the 5-try lock (SPEC §5.2 "OTP 5 tries
-- per escrow", §5.7 "OTP locks after 5 wrong tries") needs state that
-- outlives one request. record_otp_attempt() is the only way it moves -
-- same "one function, service-role only" shape escrow_transition() and
-- fund_escrow() already use. It has no caller yet: 4.7's `trip` function
-- (`POST /otp`) is what will call it once a driver can enter a code at
-- all - same as split.ts (4.2) had no caller until 4.8.
alter table escrows add column otp_tries smallint not null default 0 check (otp_tries between 0 and 5);

create function record_otp_attempt(p_escrow uuid, p_correct boolean)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  e          escrows;
  tries_left int;
begin
  select * into e from escrows where id = p_escrow for update;
  if not found then
    raise exception 'ESCROW_NOT_FOUND';
  end if;

  if e.state <> 'DELIVERED' then
    raise exception 'ESCROW_WRONG_STATE';
  end if;

  -- ponytail: "admin alerted" (SPEC §5.2) is just otp_tries = 5 being
  -- queryable - no push/email exists in the prototype (push is out of
  -- scope everywhere). Upgrade path: 4.7's trip function logs OTP_LOCKED
  -- when this raises; wire an admin alert there if it's ever needed.
  if e.otp_tries >= 5 then
    raise exception 'OTP_LOCKED';
  end if;

  if p_correct then
    return 5 - e.otp_tries;
  end if;

  -- Increments and returns in the same statement - a raise here would
  -- roll back the increment, and the whole point is that a wrong guess
  -- costs a try even on the request that discovers the lock.
  update escrows set otp_tries = otp_tries + 1, updated_at = now()
  where id = p_escrow
  returning 5 - otp_tries into tries_left;

  return tries_left;
end;
$$;

revoke all on function record_otp_attempt(uuid, boolean) from public, anon, authenticated;

grant execute on function record_otp_attempt(uuid, boolean) to service_role;
