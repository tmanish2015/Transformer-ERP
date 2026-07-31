-- Migration: sales_crm_schema (20260731090000)
-- Ported from Tradeflow-ai-ERP's sales_numbering_and_masters + sales_transaction_tables +
-- sales_invoicing_tables migrations. Scope trimmed to base CRM + base Sales per
-- docs-architecture/02-feature-mapping.md — salespersons, delivery_terms, price_lists,
-- discount_rules, credit_notes, and the full CRM extension set (customer_groups,
-- opportunities, support_tickets, customer_contacts/activities/tasks/attachments) are
-- deferred to Phase 5. Document numbering uses next_document_number() throughout.
--
-- sales_invoices.invoice_type is seeded with the full future enum now (not just
-- 'standard') because docs-architecture/02-feature-mapping.md already commits to reusing
-- this exact column for AMC/rental/repair billing in later phases — extending a check
-- constraint on a live table is a real migration; getting the enum right once now avoids
-- that churn later.

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  customer_code text not null default public.next_document_number('customer', 'CUST'),
  name text not null,
  contact_person text,
  email text,
  phone text,
  billing_address text,
  shipping_address text,
  gstin text,
  credit_limit numeric(12,2) not null default 0,
  credit_days integer not null default 0,
  status text not null default 'lead' check (status in ('lead', 'prospect', 'active', 'inactive', 'churned')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (company_id, customer_code)
);

create table public.quotations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  quotation_number text not null default public.next_document_number('quotation', 'QUO'),
  customer_id uuid not null references public.customers(id),
  quotation_date date not null default current_date,
  valid_until date,
  status text not null default 'draft' check (status in ('draft', 'pending_approval', 'approved', 'sent', 'accepted', 'rejected', 'expired')),
  subtotal numeric(12,2) not null default 0,
  discount_total numeric(12,2) not null default 0,
  tax_total numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, quotation_number)
);

create trigger trg_quotations_set_updated_at
before update on public.quotations
for each row execute function public.set_updated_at();

create table public.quotation_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  quotation_id uuid not null references public.quotations(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity numeric(12,2) not null check (quantity > 0),
  unit_price numeric(12,2) not null default 0,
  discount_percent numeric(5,2) not null default 0,
  gst_rate numeric(5,2) not null default 0,
  line_total numeric(12,2) generated always as (round(quantity * unit_price * (1 - discount_percent / 100.0) * (1 + gst_rate / 100.0), 2)) stored,
  created_at timestamptz not null default now()
);

create table public.sales_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  so_number text not null default public.next_document_number('sales_order', 'SO'),
  customer_id uuid not null references public.customers(id),
  quotation_id uuid references public.quotations(id),
  warehouse_id uuid not null references public.warehouses(id),
  order_date date not null default current_date,
  delivery_date date,
  status text not null default 'draft' check (status in ('draft', 'confirmed', 'partially_delivered', 'delivered', 'invoiced', 'cancelled')),
  subtotal numeric(12,2) not null default 0,
  discount_total numeric(12,2) not null default 0,
  tax_total numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, so_number)
);

create trigger trg_sales_orders_set_updated_at
before update on public.sales_orders
for each row execute function public.set_updated_at();

create table public.sales_order_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  sales_order_id uuid not null references public.sales_orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity numeric(12,2) not null check (quantity > 0),
  delivered_quantity numeric(12,2) not null default 0,
  invoiced_quantity numeric(12,2) not null default 0,
  unit_price numeric(12,2) not null default 0,
  discount_percent numeric(5,2) not null default 0,
  gst_rate numeric(5,2) not null default 0,
  line_total numeric(12,2) generated always as (round(quantity * unit_price * (1 - discount_percent / 100.0) * (1 + gst_rate / 100.0), 2)) stored,
  created_at timestamptz not null default now()
);

create table public.delivery_challans (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  dc_number text not null default public.next_document_number('delivery_challan', 'DC'),
  sales_order_id uuid not null references public.sales_orders(id),
  warehouse_id uuid not null references public.warehouses(id),
  delivery_date date not null default current_date,
  vehicle_number text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (company_id, dc_number)
);

create table public.delivery_challan_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  delivery_challan_id uuid not null references public.delivery_challans(id) on delete cascade,
  sales_order_item_id uuid not null references public.sales_order_items(id),
  product_id uuid not null references public.products(id),
  quantity_delivered numeric(12,2) not null check (quantity_delivered > 0),
  created_at timestamptz not null default now()
);

create table public.sales_invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  invoice_number text not null default public.next_document_number('sales_invoice', 'SINV'),
  invoice_type text not null default 'standard' check (invoice_type in ('standard', 'amc', 'rental', 'repair')),
  sales_order_id uuid references public.sales_orders(id),
  delivery_challan_id uuid references public.delivery_challans(id),
  customer_id uuid not null references public.customers(id),
  invoice_date date not null default current_date,
  due_date date,
  subtotal numeric(12,2) not null default 0,
  discount_total numeric(12,2) not null default 0,
  tax_total numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  amount_received numeric(12,2) not null default 0,
  status text not null default 'unpaid' check (status in ('unpaid', 'partially_paid', 'paid')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, invoice_number)
);

create trigger trg_sales_invoices_set_updated_at
before update on public.sales_invoices
for each row execute function public.set_updated_at();

create table public.sales_invoice_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  sales_invoice_id uuid not null references public.sales_invoices(id) on delete cascade,
  sales_order_item_id uuid references public.sales_order_items(id),
  product_id uuid not null references public.products(id),
  quantity numeric(12,2) not null check (quantity > 0),
  unit_price numeric(12,2) not null default 0,
  discount_percent numeric(5,2) not null default 0,
  gst_rate numeric(5,2) not null default 0,
  line_total numeric(12,2) generated always as (round(quantity * unit_price * (1 - discount_percent / 100.0) * (1 + gst_rate / 100.0), 2)) stored,
  created_at timestamptz not null default now()
);

create table public.sales_payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  sales_invoice_id uuid not null references public.sales_invoices(id) on delete cascade,
  payment_date date not null default current_date,
  amount numeric(12,2) not null check (amount > 0),
  payment_method text not null check (payment_method in ('cash', 'bank_transfer', 'cheque', 'upi')),
  reference_number text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
