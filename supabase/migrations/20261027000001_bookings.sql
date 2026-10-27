-- =============================================================================
-- Alexa Spa — bookings for two branches (Sangli, Karad) and their payments.
--
-- The browser never talks to this database. RLS is on with no policies and
-- anon/authenticated have no grants, so the public key can read or write
-- nothing. Only the Next.js server, with the secret key, reaches these rows.
-- =============================================================================

create table public.bookings (
  id               uuid primary key default gen_random_uuid(),
  reference        text not null unique,
  branch           text not null check (branch in ('sangli', 'karad')),
  therapy_id       text not null,
  therapy_title    text not null,
  minutes          smallint not null check (minutes between 10 and 300),
  booking_date     date not null,
  slot_time        time not null,
  guest_name       text not null check (char_length(btrim(guest_name)) between 1 and 80),
  guest_phone      text not null check (guest_phone ~ '^[6-9][0-9]{9}$'),
  guest_email      text check (guest_email is null or char_length(guest_email) <= 120),
  notes            text check (notes is null or char_length(notes) <= 500),
  therapist_pref   text not null default 'any' check (therapist_pref in ('female', 'male', 'any')),
  amount_inr       integer not null check (amount_inr > 0),
  payment_mode     text not null check (payment_mode in ('online', 'at_spa')),
  -- pending_payment: online booking waiting for Razorpay
  -- pending_confirmation: pay-at-spa booking waiting for the spa to confirm
  status           text not null check (status in (
                     'pending_payment', 'pending_confirmation', 'confirmed',
                     'completed', 'cancelled')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index bookings_branch_date_idx on public.bookings (branch, booking_date, slot_time);
create index bookings_phone_idx on public.bookings (guest_phone, created_at desc);

create table public.payments (
  id                  uuid primary key default gen_random_uuid(),
  booking_id          uuid not null references public.bookings (id) on delete restrict,
  branch              text not null check (branch in ('sangli', 'karad')),
  razorpay_order_id   text not null unique,
  razorpay_payment_id text unique,
  amount_paise        integer not null check (amount_paise > 0),
  status              text not null default 'created' check (status in ('created', 'captured', 'failed', 'refunded')),
  method              text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index payments_booking_idx on public.payments (booking_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger bookings_touch before update on public.bookings
  for each row execute function public.touch_updated_at();
create trigger payments_touch before update on public.payments
  for each row execute function public.touch_updated_at();

alter table public.bookings enable row level security;
alter table public.payments enable row level security;

revoke all on public.bookings, public.payments from anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;
