-- =============================================================================
-- Slot capacity: a branch can't take more overlapping bookings than it has
-- treatment rooms. Checked inside the database, under a per-branch-per-day
-- lock, so two guests pressing "Book" at the same moment can't both get the
-- last room.
--
-- Change a branch's room count with:
--   update public.branch_capacity set rooms = 4 where branch = 'karad';
-- =============================================================================

create table public.branch_capacity (
  branch text primary key check (branch in ('sangli', 'karad')),
  rooms  smallint not null check (rooms between 1 and 50)
);

insert into public.branch_capacity (branch, rooms) values ('sangli', 3), ('karad', 3);

alter table public.branch_capacity enable row level security;
revoke all on public.branch_capacity from anon, authenticated;

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
     and old.minutes = new.minutes and old.branch = new.branch then
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

create trigger bookings_slot_capacity before insert or update on public.bookings
  for each row execute function public.enforce_slot_capacity();
