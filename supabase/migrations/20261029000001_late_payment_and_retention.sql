-- =============================================================================
-- 1. Late payments can't overbook a slot.
--
-- An unpaid online booking holds its room for 30 minutes. If the guest pays
-- after that, someone else may have taken the room meanwhile — so moving such
-- a booking out of pending_payment re-checks capacity (SLOT_FULL if taken)
-- instead of being waved through as "already holding a room".
--
-- 2. Guest details can be removed from old bookings.
--
-- After the retention period the server blanks name, phone, email and notes,
-- keeping only the anonymous record (branch, therapy, date, amount) for the
-- accounts. That needs guest_phone to accept null.
-- =============================================================================

create or replace function public.enforce_slot_capacity()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  room_count smallint;
  taken      integer;
  new_start  time := new.slot_time;
  new_end    time := new.slot_time + make_interval(mins => new.minutes);
begin
  -- Only bookings that hold a room are checked: new ones, and ones moving
  -- back into an active state.
  if new.status not in ('pending_payment', 'pending_confirmation', 'confirmed') then
    return new;
  end if;
  if tg_op = 'UPDATE'
     and old.status in ('pending_payment', 'pending_confirmation', 'confirmed')
     and old.booking_date = new.booking_date and old.slot_time = new.slot_time
     and old.minutes = new.minutes and old.branch = new.branch
     -- ...except an unpaid booking whose hold has lapsed, now being confirmed.
     and not (old.status = 'pending_payment'
              and new.status <> 'pending_payment'
              and old.created_at <= now() - interval '30 minutes') then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtext('slot:' || new.branch || ':' || new.booking_date::text));

  select rooms into room_count from public.branch_capacity where branch = new.branch;
  if room_count is null then
    return new;
  end if;

  select count(*) into taken
  from public.bookings b
  where b.branch = new.branch
    and b.booking_date = new.booking_date
    and b.id <> new.id
    and b.slot_time < new_end
    and b.slot_time + make_interval(mins => b.minutes) > new_start
    and (
      b.status in ('pending_confirmation', 'confirmed')
      -- an unpaid online booking holds its room for 30 minutes, then lets go
      or (b.status = 'pending_payment' and b.created_at > now() - interval '30 minutes')
    );

  if taken >= room_count then
    raise exception using errcode = 'P0001', message = 'SLOT_FULL';
  end if;
  return new;
end;
$$;

revoke execute on function public.enforce_slot_capacity() from public, anon, authenticated;

alter table public.bookings alter column guest_phone drop not null;
alter table public.bookings drop constraint if exists bookings_guest_phone_check;
alter table public.bookings add constraint bookings_guest_phone_check
  check (guest_phone is null or guest_phone ~ '^[6-9][0-9]{9}$');
