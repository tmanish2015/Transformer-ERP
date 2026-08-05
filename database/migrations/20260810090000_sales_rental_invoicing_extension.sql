-- Migration: sales_rental_invoicing_extension (20260810090000)
--
-- Same shape as the repair-invoicing extension: sales_invoices.invoice_type already had
-- 'rental' pre-committed since Sprint 6, and post_sales_invoice_to_ledger() only reads
-- header totals — so the only gap is a way to trace an invoice back to its agreement.
-- One invoice per agreement (partial unique index), same simplification already made
-- for repair jobs; recurring/multi-invoice billing per agreement is a later concern.

alter table public.sales_invoices
  add column rental_agreement_id uuid references public.rental_agreements(id);

create unique index sales_invoices_rental_agreement_id_uidx on public.sales_invoices(rental_agreement_id) where rental_agreement_id is not null;

-- Computes the invoice line items for a rental agreement: base rental (agreed days x
-- daily rate), operator/fuel charges if applicable, a late-return charge if the return
-- was late, and one line per customer-chargeable damage item found at inspection.
-- Returned as a table so the client composes sales_invoice_items from it directly,
-- rather than duplicating this arithmetic in JS — same reasoning as pushing the
-- warranty end_date and return late_days computations into Postgres.
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
