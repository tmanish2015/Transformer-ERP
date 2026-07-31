-- Migration: rental_business_logic_triggers (20260807090500)
-- Same recompute-totals-from-line-items pattern as repair estimates / sales invoices,
-- and the same child-table-drives-parent-status pattern as apply_repair_estimate_status.

create or replace function public.recompute_rental_quotation_totals()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  target_id := coalesce(new.rental_quotation_id, old.rental_quotation_id);
  update public.rental_quotations rq
  set
    subtotal = coalesce((select sum(rental_days * daily_rate) from public.rental_quotation_items where rental_quotation_id = target_id), 0),
    tax_total = coalesce((select sum(line_total - rental_days * daily_rate) from public.rental_quotation_items where rental_quotation_id = target_id), 0),
    total = coalesce((select sum(line_total) from public.rental_quotation_items where rental_quotation_id = target_id), 0)
  where rq.id = target_id;
  return coalesce(new, old);
end;
$$;

create trigger trg_recompute_rental_quotation_totals
after insert or update or delete on public.rental_quotation_items
for each row execute function public.recompute_rental_quotation_totals();

revoke all on function public.recompute_rental_quotation_totals() from public, anon, authenticated;

-- A quotation raised against an inquiry moves that inquiry forward automatically.
create or replace function public.apply_rental_quotation_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.rental_inquiry_id is not null then
    update public.rental_inquiries set status = 'quoted' where id = new.rental_inquiry_id and status = 'open';
  end if;
  return new;
end;
$$;

create trigger trg_apply_rental_quotation_status
after insert on public.rental_quotations
for each row execute function public.apply_rental_quotation_status();

revoke all on function public.apply_rental_quotation_status() from public, anon, authenticated;

-- Booking an asset reserves it — validated here (not just a conditional update) so a
-- double-booking attempt gets a clear error instead of a silent no-op. Also cascades the
-- quotation (and, through it, the inquiry) forward, same as apply_repair_estimate_status
-- cascades a job card.
create or replace function public.apply_rental_booking_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  asset_status text;
begin
  select status into asset_status from public.rental_assets where id = new.rental_asset_id for update;
  if asset_status is distinct from 'available' then
    raise exception 'Rental asset is not available for booking (current status: %)', asset_status;
  end if;

  update public.rental_assets set status = 'booked' where id = new.rental_asset_id;
  insert into public.rental_asset_status_log (rental_asset_id, status, reference_type, reference_id)
  values (new.rental_asset_id, 'booked', 'rental_booking', new.id);

  if new.rental_quotation_id is not null then
    update public.rental_quotations set status = 'accepted' where id = new.rental_quotation_id;
    update public.rental_inquiries ri
    set status = 'converted'
    from public.rental_quotations rq
    where rq.id = new.rental_quotation_id and rq.rental_inquiry_id = ri.id and ri.status <> 'converted';
  end if;

  return new;
end;
$$;

create trigger trg_apply_rental_booking_status
before insert on public.rental_bookings
for each row execute function public.apply_rental_booking_status();

revoke all on function public.apply_rental_booking_status() from public, anon, authenticated;

-- Cancelling a booking frees the asset back up.
create or replace function public.apply_rental_booking_cancellation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'cancelled' and old.status <> 'cancelled' then
    update public.rental_assets set status = 'available' where id = new.rental_asset_id and status = 'booked';
    insert into public.rental_asset_status_log (rental_asset_id, status, reference_type, reference_id)
    values (new.rental_asset_id, 'available', 'rental_booking', new.id);
  end if;
  return new;
end;
$$;

create trigger trg_apply_rental_booking_cancellation
after update on public.rental_bookings
for each row execute function public.apply_rental_booking_cancellation();

revoke all on function public.apply_rental_booking_cancellation() from public, anon, authenticated;
