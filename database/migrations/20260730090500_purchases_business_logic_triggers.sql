-- Migration: purchases_business_logic_triggers (20260730090500)
-- Ported verbatim from Tradeflow's purchase_business_logic_triggers — no tenant-scoping
-- changes needed here, since every statement operates by id (already tenant-scoped via
-- the row it's given) rather than by a bare company-wide query.

create or replace function public.recompute_po_totals()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_po_id uuid;
begin
  target_po_id := coalesce(new.purchase_order_id, old.purchase_order_id);

  update public.purchase_orders po
  set
    subtotal = coalesce((select sum(quantity * unit_price) from public.purchase_order_items where purchase_order_id = target_po_id), 0),
    tax_total = coalesce((select sum(line_total - quantity * unit_price) from public.purchase_order_items where purchase_order_id = target_po_id), 0),
    total = coalesce((select sum(line_total) from public.purchase_order_items where purchase_order_id = target_po_id), 0)
  where po.id = target_po_id;

  return coalesce(new, old);
end;
$$;

create trigger trg_recompute_po_totals
after insert or update or delete on public.purchase_order_items
for each row execute function public.recompute_po_totals();

revoke all on function public.recompute_po_totals() from public, anon, authenticated;

-- Receiving goods: create stock movement, update received_quantity, recalc PO status
create or replace function public.apply_goods_receipt_item()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  grn record;
  po_id uuid;
  total_qty numeric;
  total_received numeric;
begin
  select * into grn from public.goods_receipts where id = new.goods_receipt_id;

  insert into public.stock_movements (product_id, warehouse_id, movement_type, quantity, reference_type, reference_id, notes)
  values (new.product_id, grn.warehouse_id, 'purchase', new.quantity_received, 'goods_receipt', new.goods_receipt_id, 'Received via ' || grn.grn_number);

  update public.purchase_order_items
  set received_quantity = received_quantity + new.quantity_received
  where id = new.purchase_order_item_id;

  select purchase_order_id into po_id from public.purchase_order_items where id = new.purchase_order_item_id;

  select sum(quantity), sum(received_quantity) into total_qty, total_received
  from public.purchase_order_items where purchase_order_id = po_id;

  update public.purchase_orders
  set status = case
    when total_received >= total_qty then 'received'
    when total_received > 0 then 'partially_received'
    else status
  end
  where id = po_id;

  return new;
end;
$$;

create trigger trg_apply_goods_receipt_item
after insert on public.goods_receipt_items
for each row execute function public.apply_goods_receipt_item();

revoke all on function public.apply_goods_receipt_item() from public, anon, authenticated;

-- Recording a payment updates the bill's amount_paid and status
create or replace function public.apply_purchase_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  bill_total numeric;
  new_paid numeric;
begin
  select total, amount_paid + new.amount into bill_total, new_paid
  from public.purchase_bills where id = new.purchase_bill_id;

  update public.purchase_bills
  set
    amount_paid = new_paid,
    status = case
      when new_paid >= bill_total then 'paid'
      when new_paid > 0 then 'partially_paid'
      else 'unpaid'
    end
  where id = new.purchase_bill_id;

  return new;
end;
$$;

create trigger trg_apply_purchase_payment
after insert on public.purchase_payments
for each row execute function public.apply_purchase_payment();

revoke all on function public.apply_purchase_payment() from public, anon, authenticated;
