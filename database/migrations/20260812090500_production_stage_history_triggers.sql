-- Migration: production_stage_history_triggers (20260812090500)
--
-- Raw materials are consumed once, when the FIRST stage is logged (production actually
-- starting on the shop floor) — not spread across every stage, and not deferred to
-- completion. The finished, serial-tracked output is created once, at the final
-- 'dispatch' stage. Mirrors the child-table-drives-parent-status pattern used
-- throughout (apply_repair_estimate_status, apply_rental_booking_status, etc).

create or replace function public.apply_production_stage_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ord record;
  stage_count integer;
  req record;
  i integer;
begin
  select * into ord from public.production_orders where id = new.production_order_id;

  update public.production_orders set current_stage = new.stage where id = new.production_order_id;

  select count(*) into stage_count from public.production_stage_history where production_order_id = new.production_order_id;

  if stage_count = 1 and ord.status in ('draft', 'planned') then
    update public.production_orders set status = 'in_progress' where id = new.production_order_id;

    for req in select * from public.raw_material_requirements where production_order_id = new.production_order_id loop
      insert into public.stock_movements (product_id, warehouse_id, movement_type, quantity, reference_type, reference_id)
      values (req.raw_material_product_id, ord.warehouse_id, 'production_consumption', -req.required_qty, 'production_order', ord.id);
    end loop;
  end if;

  if new.stage = 'dispatch' then
    update public.production_orders set status = 'completed' where id = new.production_order_id;

    insert into public.stock_movements (product_id, warehouse_id, movement_type, quantity, reference_type, reference_id)
    values (ord.product_id, ord.warehouse_id, 'production_output', ord.quantity, 'production_order', ord.id);

    for i in 1..ord.quantity::integer loop
      insert into public.serial_numbers (product_id, serial_no, current_status, current_warehouse_id)
      values (ord.product_id, ord.order_number || '-' || i, 'in_stock', ord.warehouse_id);
    end loop;
  end if;

  return new;
end;
$$;

create trigger trg_apply_production_stage_history
after insert on public.production_stage_history
for each row execute function public.apply_production_stage_history();

revoke all on function public.apply_production_stage_history() from public, anon, authenticated;
