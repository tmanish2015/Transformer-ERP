-- Migration: manufacturing_schema (20260811090000)
--
-- Phase 4 Sprint 17 per docs-architecture/06-sprint-planning.md. production_manager is a
-- new role — Phase 0's seed had one manager role per vertical already planned
-- (workshop_manager, rental_coordinator, lab_engineer) but nothing for manufacturing
-- since it hadn't been designed yet.
--
-- raw_material_requirements is a snapshot taken at order-creation time (via
-- explode_bom below), not a live view of bom_lines — so editing a BOM later doesn't
-- retroactively change what an already-raised production order required.

insert into public.roles (key, name, description) values
  ('production_manager', 'Production Manager', 'Manages BOMs and production orders');

create table public.boms (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  product_id uuid not null references public.products(id),
  version integer not null default 1,
  name text,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, product_id, version)
);

create trigger trg_boms_set_updated_at
before update on public.boms
for each row execute function public.set_updated_at();

create table public.bom_lines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  bom_id uuid not null references public.boms(id) on delete cascade,
  raw_material_product_id uuid not null references public.products(id),
  qty numeric(12,2) not null check (qty > 0),
  unit_id uuid not null references public.units(id),
  created_at timestamptz not null default now()
);

create table public.production_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  order_number text not null default public.next_document_number('production_order', 'PRO'),
  product_id uuid not null references public.products(id),
  bom_id uuid not null references public.boms(id),
  quantity numeric(12,2) not null check (quantity > 0),
  warehouse_id uuid not null references public.warehouses(id),
  status text not null default 'draft' check (status in ('draft', 'planned', 'in_progress', 'completed', 'cancelled')),
  current_stage text check (current_stage in ('winding', 'assembly', 'testing', 'painting', 'packing', 'dispatch')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, order_number)
);

create trigger trg_production_orders_set_updated_at
before update on public.production_orders
for each row execute function public.set_updated_at();

create table public.raw_material_requirements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  production_order_id uuid not null references public.production_orders(id) on delete cascade,
  raw_material_product_id uuid not null references public.products(id),
  required_qty numeric(12,2) not null,
  unit_id uuid not null references public.units(id),
  created_at timestamptz not null default now()
);

-- Computes raw material requirements for a hypothetical (or about-to-be-created)
-- production order, given a BOM and a target quantity. Called by the client right
-- after inserting the production_orders row, then the results are inserted into
-- raw_material_requirements as a snapshot — see file header note.
create or replace function public.explode_bom(p_bom_id uuid, p_qty numeric)
returns table (raw_material_product_id uuid, required_qty numeric, unit_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select bl.raw_material_product_id, bl.qty * p_qty, bl.unit_id
  from public.bom_lines bl
  where bl.bom_id = p_bom_id;
$$;

revoke all on function public.explode_bom(uuid, numeric) from public, anon;
grant execute on function public.explode_bom(uuid, numeric) to authenticated;
