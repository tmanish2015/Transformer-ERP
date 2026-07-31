-- Migration: rental_return_inspection_triggers (20260809090500)

-- Returning validates the asset is actually running (same guard style as dispatch),
-- computes lateness server-side, moves the asset to 'returned', and completes the
-- agreement — inspection (below) is what decides where the asset goes from here.
create or replace function public.apply_rental_return_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  agreement record;
  asset_status text;
begin
  select * into agreement from public.rental_agreements where id = new.rental_agreement_id;

  select status into asset_status from public.rental_assets where id = agreement.rental_asset_id for update;
  if asset_status is distinct from 'running' then
    raise exception 'Rental asset is not running, cannot be returned (current status: %)', asset_status;
  end if;

  new.late_days := greatest(0, (new.returned_at::date - agreement.end_date));
  new.is_late := new.late_days > 0;

  update public.rental_assets set status = 'returned' where id = agreement.rental_asset_id;
  insert into public.rental_asset_status_log (rental_asset_id, status, reference_type, reference_id) values (agreement.rental_asset_id, 'returned', 'rental_return', new.id);

  update public.rental_agreements set status = 'completed' where id = new.rental_agreement_id;

  return new;
end;
$$;

create trigger trg_apply_rental_return_status
before insert on public.rental_returns
for each row execute function public.apply_rental_return_status();

revoke all on function public.apply_rental_return_status() from public, anon, authenticated;

-- Inspection outcome decides whether the asset goes back into the available pool or
-- needs maintenance first.
create or replace function public.apply_rental_inspection_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  asset_id uuid;
  next_status text;
begin
  select ra.rental_asset_id into asset_id
  from public.rental_returns rr
  join public.rental_agreements ra on ra.id = rr.rental_agreement_id
  where rr.id = new.rental_return_id;

  next_status := case when new.condition_rating = 'damaged' then 'maintenance' else 'available' end;

  update public.rental_assets set status = next_status where id = asset_id;
  insert into public.rental_asset_status_log (rental_asset_id, status, reference_type, reference_id) values (asset_id, next_status, 'rental_inspection', new.id);

  return new;
end;
$$;

create trigger trg_apply_rental_inspection_status
after insert on public.rental_inspections
for each row execute function public.apply_rental_inspection_status();

revoke all on function public.apply_rental_inspection_status() from public, anon, authenticated;
