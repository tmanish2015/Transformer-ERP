-- Migration: inventory_schema (20260728090000)
-- Ported from Tradeflow-ai-ERP's inventory_schema + warehouse_management_schema
-- migrations. Every table gains company_id (see companies_and_tenant_scoping migration);
-- previously-global unique constraints (sku, short_code, warehouse code) become
-- per-company uniques. Two additions beyond the reference: serial_numbers (individually
-- tracked transformer units) and scrap_entries — see docs-architecture/03-database-design.md.
--
-- company_id defaults to current_company_id() on every table: client code (ported
-- verbatim from Tradeflow, e.g. features/inventory/api/lookup-api.ts) never sets it
-- explicitly on insert, so the column must populate itself. RLS's `with check` still
-- guards against a caller passing a different company_id outright.

create table public.units (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  name text not null,
  short_code text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (company_id, short_code)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  name text not null,
  parent_id uuid references public.categories(id) on delete set null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  name text not null,
  logo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.warehouses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  name text not null,
  code text not null,
  address text,
  city text,
  state text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (company_id, code)
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  name text not null,
  contact_person text,
  email text,
  phone text,
  address text,
  gstin text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  sku text not null,
  name text not null,
  description text,
  category_id uuid references public.categories(id) on delete set null,
  brand_id uuid references public.brands(id) on delete set null,
  unit_id uuid not null references public.units(id),
  hsn_code text,
  gst_rate numeric(5,2) not null default 0,
  purchase_price numeric(12,2) not null default 0,
  selling_price numeric(12,2) not null default 0,
  barcode text,
  image_url text,
  reorder_level numeric(12,2) not null default 0,
  reorder_quantity numeric(12,2) not null default 0,
  is_batch_tracked boolean not null default false,
  is_serial_tracked boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, sku)
);

create trigger trg_products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

create table public.product_suppliers (
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  product_id uuid not null references public.products(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  supplier_sku text,
  cost_price numeric(12,2),
  is_preferred boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (product_id, supplier_id)
);

create table public.product_batches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  product_id uuid not null references public.products(id) on delete cascade,
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  batch_number text not null,
  manufacture_date date,
  expiry_date date,
  quantity numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, warehouse_id, batch_number)
);

-- Individually tracked units (e.g. a specific transformer, not a fungible stock quantity).
create table public.serial_numbers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  product_id uuid not null references public.products(id) on delete cascade,
  serial_no text not null,
  current_status text not null default 'in_stock' check (current_status in ('in_stock', 'reserved', 'dispatched', 'installed', 'scrapped')),
  current_warehouse_id uuid references public.warehouses(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (company_id, serial_no)
);

create table public.scrap_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  product_id uuid not null references public.products(id),
  warehouse_id uuid not null references public.warehouses(id),
  quantity numeric(12,2) not null,
  reason text not null,
  scrapped_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Materialized current stock, synced by trigger from stock_movements.
create table public.stock_levels (
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  product_id uuid not null references public.products(id) on delete cascade,
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  quantity numeric(12,2) not null default 0,
  updated_at timestamptz not null default now(),
  primary key (product_id, warehouse_id)
);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  product_id uuid not null references public.products(id) on delete cascade,
  warehouse_id uuid not null references public.warehouses(id) on delete cascade,
  batch_id uuid references public.product_batches(id) on delete set null,
  serial_number_id uuid references public.serial_numbers(id) on delete set null,
  movement_type text not null check (movement_type in ('purchase','sale','adjustment','transfer_in','transfer_out','return','scrap')),
  quantity numeric(12,2) not null,
  reference_type text,
  reference_id uuid,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Keep stock_levels (and batch quantity) in sync with movements. Locked down (only the
-- trigger can call it) same as Tradeflow's equivalent function.
create or replace function public.apply_stock_movement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.stock_levels (company_id, product_id, warehouse_id, quantity, updated_at)
  values (new.company_id, new.product_id, new.warehouse_id, new.quantity, now())
  on conflict (product_id, warehouse_id)
  do update set quantity = public.stock_levels.quantity + new.quantity, updated_at = now();

  if new.batch_id is not null then
    update public.product_batches
    set quantity = quantity + new.quantity
    where id = new.batch_id;
  end if;

  return new;
end;
$$;

create trigger trg_apply_stock_movement
after insert on public.stock_movements
for each row execute function public.apply_stock_movement();

revoke all on function public.apply_stock_movement() from public, anon, authenticated;
