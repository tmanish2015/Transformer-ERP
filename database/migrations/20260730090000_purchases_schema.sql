-- Migration: purchases_schema (20260730090000)
-- Ported from Tradeflow-ai-ERP's purchase_schema migration. Document numbering uses the
-- generic next_document_number() (see document_numbering migration) instead of Tradeflow's
-- per-type global sequences — same reasoning as journal entries: a plain sequence would
-- make numbers jump unpredictably across companies. Tenant scoping added throughout.

create table public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  po_number text not null default public.next_document_number('purchase_order', 'PO'),
  supplier_id uuid not null references public.suppliers(id),
  warehouse_id uuid not null references public.warehouses(id),
  status text not null default 'draft' check (status in ('draft','pending_approval','approved','sent','partially_received','received','cancelled')),
  order_date date not null default current_date,
  expected_date date,
  notes text,
  subtotal numeric(12,2) not null default 0,
  tax_total numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, po_number)
);

create index purchase_orders_company_id_idx on public.purchase_orders(company_id);
create index purchase_orders_supplier_id_idx on public.purchase_orders(supplier_id);
create index purchase_orders_warehouse_id_idx on public.purchase_orders(warehouse_id);
create index purchase_orders_status_idx on public.purchase_orders(status);
create index purchase_orders_created_by_idx on public.purchase_orders(created_by);
create index purchase_orders_approved_by_idx on public.purchase_orders(approved_by);

create trigger trg_purchase_orders_set_updated_at
before update on public.purchase_orders
for each row execute function public.set_updated_at();

create table public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity numeric(12,2) not null check (quantity > 0),
  received_quantity numeric(12,2) not null default 0,
  unit_price numeric(12,2) not null default 0,
  gst_rate numeric(5,2) not null default 0,
  line_total numeric(12,2) generated always as (round(quantity * unit_price * (1 + gst_rate / 100.0), 2)) stored,
  created_at timestamptz not null default now()
);

create index purchase_order_items_company_id_idx on public.purchase_order_items(company_id);
create index purchase_order_items_po_id_idx on public.purchase_order_items(purchase_order_id);
create index purchase_order_items_product_id_idx on public.purchase_order_items(product_id);

create table public.goods_receipts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  grn_number text not null default public.next_document_number('goods_receipt', 'GRN'),
  purchase_order_id uuid not null references public.purchase_orders(id),
  warehouse_id uuid not null references public.warehouses(id),
  received_date date not null default current_date,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (company_id, grn_number)
);

create index goods_receipts_company_id_idx on public.goods_receipts(company_id);
create index goods_receipts_po_id_idx on public.goods_receipts(purchase_order_id);
create index goods_receipts_warehouse_id_idx on public.goods_receipts(warehouse_id);
create index goods_receipts_created_by_idx on public.goods_receipts(created_by);

create table public.goods_receipt_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  goods_receipt_id uuid not null references public.goods_receipts(id) on delete cascade,
  purchase_order_item_id uuid not null references public.purchase_order_items(id),
  product_id uuid not null references public.products(id),
  quantity_received numeric(12,2) not null check (quantity_received > 0),
  created_at timestamptz not null default now()
);

create index goods_receipt_items_company_id_idx on public.goods_receipt_items(company_id);
create index goods_receipt_items_grn_id_idx on public.goods_receipt_items(goods_receipt_id);
create index goods_receipt_items_poi_id_idx on public.goods_receipt_items(purchase_order_item_id);
create index goods_receipt_items_product_id_idx on public.goods_receipt_items(product_id);

create table public.purchase_bills (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  bill_number text not null default public.next_document_number('purchase_bill', 'BILL'),
  purchase_order_id uuid references public.purchase_orders(id),
  supplier_id uuid not null references public.suppliers(id),
  bill_date date not null default current_date,
  due_date date,
  subtotal numeric(12,2) not null default 0,
  tax_total numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  amount_paid numeric(12,2) not null default 0,
  status text not null default 'unpaid' check (status in ('unpaid','partially_paid','paid')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, bill_number)
);

create index purchase_bills_company_id_idx on public.purchase_bills(company_id);
create index purchase_bills_supplier_id_idx on public.purchase_bills(supplier_id);
create index purchase_bills_po_id_idx on public.purchase_bills(purchase_order_id);
create index purchase_bills_status_idx on public.purchase_bills(status);
create index purchase_bills_created_by_idx on public.purchase_bills(created_by);

create trigger trg_purchase_bills_set_updated_at
before update on public.purchase_bills
for each row execute function public.set_updated_at();

create table public.purchase_payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  purchase_bill_id uuid not null references public.purchase_bills(id) on delete cascade,
  payment_date date not null default current_date,
  amount numeric(12,2) not null check (amount > 0),
  payment_method text not null check (payment_method in ('cash','bank_transfer','cheque','upi')),
  reference_number text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index purchase_payments_company_id_idx on public.purchase_payments(company_id);
create index purchase_payments_bill_id_idx on public.purchase_payments(purchase_bill_id);
create index purchase_payments_created_by_idx on public.purchase_payments(created_by);
