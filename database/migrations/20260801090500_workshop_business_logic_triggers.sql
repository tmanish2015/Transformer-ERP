-- Migration: workshop_business_logic_triggers (20260801090500)
-- Same recompute-totals-from-line-items pattern as quotations/sales_orders/purchase_orders.

create or replace function public.recompute_repair_estimate_totals()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  target_id := coalesce(new.repair_estimate_id, old.repair_estimate_id);
  update public.repair_estimates re
  set
    subtotal = coalesce((select sum(quantity * unit_price) from public.repair_estimate_items where repair_estimate_id = target_id), 0),
    tax_total = coalesce((select sum(line_total - quantity * unit_price) from public.repair_estimate_items where repair_estimate_id = target_id), 0),
    total = coalesce((select sum(line_total) from public.repair_estimate_items where repair_estimate_id = target_id), 0)
  where re.id = target_id;
  return coalesce(new, old);
end;
$$;

create trigger trg_recompute_repair_estimate_totals
after insert or update or delete on public.repair_estimate_items
for each row execute function public.recompute_repair_estimate_totals();

revoke all on function public.recompute_repair_estimate_totals() from public, anon, authenticated;

-- A customer-approved estimate moves its parent job card forward automatically —
-- mirrors how a received goods receipt / delivery challan moves its parent PO/SO status.
create or replace function public.apply_repair_estimate_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'customer_approved' and old.status <> 'customer_approved' then
    update public.repair_jobs set status = 'approved' where id = new.repair_job_id and status = 'estimate_pending';
  elsif new.status = 'customer_rejected' and old.status <> 'customer_rejected' then
    update public.repair_jobs set status = 'rejected' where id = new.repair_job_id and status = 'estimate_pending';
  elsif new.status = 'sent' and old.status = 'draft' then
    update public.repair_jobs set status = 'estimate_pending' where id = new.repair_job_id;
  end if;
  return new;
end;
$$;

create trigger trg_apply_repair_estimate_status
after update on public.repair_estimates
for each row execute function public.apply_repair_estimate_status();

revoke all on function public.apply_repair_estimate_status() from public, anon, authenticated;
