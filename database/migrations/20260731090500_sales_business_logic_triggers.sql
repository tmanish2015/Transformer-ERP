-- Migration: sales_business_logic_triggers (20260731090500)
-- Ported verbatim from Tradeflow's sales_business_logic_triggers — no tenant-scoping
-- changes needed, same reasoning as purchases: every statement operates by id.

create or replace function public.recompute_quotation_totals()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  target_id := coalesce(new.quotation_id, old.quotation_id);
  update public.quotations q
  set
    subtotal = coalesce((select sum(quantity * unit_price) from public.quotation_items where quotation_id = target_id), 0),
    discount_total = coalesce((select sum(quantity * unit_price * discount_percent / 100.0) from public.quotation_items where quotation_id = target_id), 0),
    tax_total = coalesce((select sum(line_total - quantity * unit_price * (1 - discount_percent / 100.0)) from public.quotation_items where quotation_id = target_id), 0),
    total = coalesce((select sum(line_total) from public.quotation_items where quotation_id = target_id), 0)
  where q.id = target_id;
  return coalesce(new, old);
end;
$$;

create trigger trg_recompute_quotation_totals
after insert or update or delete on public.quotation_items
for each row execute function public.recompute_quotation_totals();

revoke all on function public.recompute_quotation_totals() from public, anon, authenticated;

create or replace function public.recompute_so_totals()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  target_id := coalesce(new.sales_order_id, old.sales_order_id);
  update public.sales_orders so
  set
    subtotal = coalesce((select sum(quantity * unit_price) from public.sales_order_items where sales_order_id = target_id), 0),
    discount_total = coalesce((select sum(quantity * unit_price * discount_percent / 100.0) from public.sales_order_items where sales_order_id = target_id), 0),
    tax_total = coalesce((select sum(line_total - quantity * unit_price * (1 - discount_percent / 100.0)) from public.sales_order_items where sales_order_id = target_id), 0),
    total = coalesce((select sum(line_total) from public.sales_order_items where sales_order_id = target_id), 0)
  where so.id = target_id;
  return coalesce(new, old);
end;
$$;

create trigger trg_recompute_so_totals
after insert or update or delete on public.sales_order_items
for each row execute function public.recompute_so_totals();

revoke all on function public.recompute_so_totals() from public, anon, authenticated;

create or replace function public.recompute_sales_invoice_totals()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  target_id := coalesce(new.sales_invoice_id, old.sales_invoice_id);
  update public.sales_invoices si
  set
    subtotal = coalesce((select sum(quantity * unit_price) from public.sales_invoice_items where sales_invoice_id = target_id), 0),
    discount_total = coalesce((select sum(quantity * unit_price * discount_percent / 100.0) from public.sales_invoice_items where sales_invoice_id = target_id), 0),
    tax_total = coalesce((select sum(line_total - quantity * unit_price * (1 - discount_percent / 100.0)) from public.sales_invoice_items where sales_invoice_id = target_id), 0),
    total = coalesce((select sum(line_total) from public.sales_invoice_items where sales_invoice_id = target_id), 0)
  where si.id = target_id;
  return coalesce(new, old);
end;
$$;

create trigger trg_recompute_sales_invoice_totals
after insert or update or delete on public.sales_invoice_items
for each row execute function public.recompute_sales_invoice_totals();

revoke all on function public.recompute_sales_invoice_totals() from public, anon, authenticated;

-- Delivering goods: create stock movement (negative), update delivered_quantity, recalc SO status
create or replace function public.apply_delivery_challan_item()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  dc record;
  so_id uuid;
  total_qty numeric;
  total_delivered numeric;
begin
  select * into dc from public.delivery_challans where id = new.delivery_challan_id;

  insert into public.stock_movements (product_id, warehouse_id, movement_type, quantity, reference_type, reference_id, notes)
  values (new.product_id, dc.warehouse_id, 'sale', -new.quantity_delivered, 'delivery_challan', new.delivery_challan_id, 'Delivered via ' || dc.dc_number);

  update public.sales_order_items
  set delivered_quantity = delivered_quantity + new.quantity_delivered
  where id = new.sales_order_item_id;

  select sales_order_id into so_id from public.sales_order_items where id = new.sales_order_item_id;

  select sum(quantity), sum(delivered_quantity) into total_qty, total_delivered
  from public.sales_order_items where sales_order_id = so_id;

  update public.sales_orders
  set status = case
    when total_delivered >= total_qty then 'delivered'
    when total_delivered > 0 then 'partially_delivered'
    else status
  end
  where id = so_id;

  return new;
end;
$$;

create trigger trg_apply_delivery_challan_item
after insert on public.delivery_challan_items
for each row execute function public.apply_delivery_challan_item();

revoke all on function public.apply_delivery_challan_item() from public, anon, authenticated;

-- Recording a payment updates the invoice's amount_received and status
create or replace function public.apply_sales_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  invoice_total numeric;
  new_received numeric;
begin
  select total, amount_received + new.amount into invoice_total, new_received
  from public.sales_invoices where id = new.sales_invoice_id;

  update public.sales_invoices
  set
    amount_received = new_received,
    status = case
      when new_received >= invoice_total then 'paid'
      when new_received > 0 then 'partially_paid'
      else 'unpaid'
    end
  where id = new.sales_invoice_id;

  return new;
end;
$$;

create trigger trg_apply_sales_payment
after insert on public.sales_payments
for each row execute function public.apply_sales_payment();

revoke all on function public.apply_sales_payment() from public, anon, authenticated;
