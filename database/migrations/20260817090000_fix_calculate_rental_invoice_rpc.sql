-- Migration: fix_calculate_rental_invoice_rpc (20260817090000)
--
-- The live `calculate_rental_invoice(uuid)` RPC was deployed from an earlier broken
-- draft that read the unit price from `agr.daily_rental_rate` (a field that does NOT
-- exist on `rental_agreements`). The daily rate lives on `rental_assets.daily_rental_rate`,
-- which the function already loads into the `ra` record via `rental_asset_id`.
--
-- This migration re-creates the function with the corrected body so the rental line
-- unit price is always taken from `rental_assets` (never hard-coded), and re-grants
-- EXECUTE to `authenticated`. No other schema, RLS, or permission is changed.

create or replace function public.calculate_rental_invoice(p_agreement_id uuid)
returns table (description text, quantity numeric, unit_price numeric, gst_rate numeric)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  agr record;
  ra record;
  ret record;
  rental_days numeric;
  damage_row record;
begin
  select * into agr from public.rental_agreements where id = p_agreement_id;
  if not found then
    return;
  end if;

  -- Unit price for the base rental charge comes from the asset's daily rate.
  select * into ra from public.rental_assets where id = agr.rental_asset_id;
  rental_days := (agr.end_date - agr.start_date) + 1;

  description := 'Rental charge (' || rental_days || ' days)';
  quantity := rental_days;
  unit_price := ra.daily_rental_rate;
  gst_rate := 18;
  return next;

  if agr.operator_provided and agr.operator_charge_rate > 0 then
    description := 'Operator charge (' || rental_days || ' days)';
    quantity := rental_days;
    unit_price := agr.operator_charge_rate;
    gst_rate := 18;
    return next;
  end if;

  if agr.fuel_charge_rate > 0 then
    description := 'Fuel charge (' || rental_days || ' days)';
    quantity := rental_days;
    unit_price := agr.fuel_charge_rate;
    gst_rate := 18;
    return next;
  end if;

  select * into ret from public.rental_returns where rental_agreement_id = p_agreement_id;
  if found and ret.is_late and ret.late_days > 0 then
    description := 'Late return charge (' || ret.late_days || ' days)';
    quantity := ret.late_days;
    unit_price := agr.late_return_charge_rate;
    gst_rate := 0;
    return next;
  end if;

  for damage_row in
    select rda.description as desc_text, rda.estimated_repair_cost as cost
    from public.rental_damage_assessments rda
    join public.rental_inspections ri on ri.id = rda.rental_inspection_id
    join public.rental_returns rr on rr.id = ri.rental_return_id
    where rr.rental_agreement_id = p_agreement_id and rda.charged_to_customer = true
  loop
    description := damage_row.desc_text;
    quantity := 1;
    unit_price := damage_row.cost;
    gst_rate := 0;
    return next;
  end loop;

  return;
end;
$$;

revoke all on function public.calculate_rental_invoice(uuid) from public, anon;
grant execute on function public.calculate_rental_invoice(uuid) to authenticated;
