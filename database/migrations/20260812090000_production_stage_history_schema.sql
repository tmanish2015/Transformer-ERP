-- Migration: production_stage_history_schema (20260812090000)
--
-- Phase 4 Sprint 18 per docs-architecture/06-sprint-planning.md. Append-only, same
-- convention as repair_job_stage_history / rental_asset_status_log.
--
-- stock_movements.movement_type gains two values for this vertical: raw materials are
-- consumed (negative qty) and the finished good is produced (positive qty). No change
-- needed to apply_stock_movement() — it already just adds signed quantity, regardless
-- of movement_type (see that function's original comment in 20260728090000).

create table public.production_stage_history (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  production_order_id uuid not null references public.production_orders(id) on delete cascade,
  stage text not null check (stage in ('winding', 'assembly', 'testing', 'painting', 'packing', 'dispatch')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.stock_movements drop constraint if exists stock_movements_movement_type_check;
alter table public.stock_movements add constraint stock_movements_movement_type_check
  check (movement_type in ('purchase', 'sale', 'adjustment', 'transfer_in', 'transfer_out', 'return', 'scrap', 'production_consumption', 'production_output'));
