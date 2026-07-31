-- Migration: rental_agreement_dispatch_triggers (20260808091000)

-- Converting a booking into an agreement completes that booking's job.
create or replace function public.apply_rental_agreement_creation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.rental_bookings set status = 'completed' where id = new.rental_booking_id;
  return new;
end;
$$;

create trigger trg_apply_rental_agreement_creation
after insert on public.rental_agreements
for each row execute function public.apply_rental_agreement_creation();

revoke all on function public.apply_rental_agreement_creation() from public, anon, authenticated;

-- Dispatching moves the asset from booked straight to running (the trip itself, once
-- logged, already represents the delivery being complete — there's no separate
-- "confirm the customer received it" step in this sprint). Both intermediate states get
-- a status-log row for auditability even though the user only takes one action.
create or replace function public.apply_rental_dispatch_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  asset_id uuid;
  asset_status text;
begin
  select rental_asset_id into asset_id from public.rental_agreements where id = new.rental_agreement_id;

  select status into asset_status from public.rental_assets where id = asset_id for update;
  if asset_status is distinct from 'booked' then
    raise exception 'Rental asset is not in booked state for dispatch (current status: %)', asset_status;
  end if;

  update public.rental_assets set status = 'running' where id = asset_id;
  insert into public.rental_asset_status_log (rental_asset_id, status, reference_type, reference_id) values (asset_id, 'dispatched', 'rental_dispatch', new.id);
  insert into public.rental_asset_status_log (rental_asset_id, status, reference_type, reference_id) values (asset_id, 'running', 'rental_dispatch', new.id);

  return new;
end;
$$;

create trigger trg_apply_rental_dispatch_status
before insert on public.rental_dispatches
for each row execute function public.apply_rental_dispatch_status();

revoke all on function public.apply_rental_dispatch_status() from public, anon, authenticated;
