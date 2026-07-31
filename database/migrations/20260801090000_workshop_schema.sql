-- Migration: workshop_schema (20260801090000)
--
-- Transformer Repair Workshop — the first genuinely new module (no Tradeflow
-- equivalent to port). Sprint 7 scope per docs-architecture/06-sprint-planning.md:
-- job card intake + estimate + customer approval only. Stage-by-stage repair tracking
-- (dismantling/core-inspection/.../installation) is Sprint 8's repair_job_stage_history;
-- job status here stays coarse until that lands. Invoicing (sales_invoices with
-- invoice_type='repair') and warranty are Sprint 10.
--
-- Pickup is tracked as plain columns on repair_jobs, not a trips/logistics table — a real
-- Logistics module (vehicles, drivers) is a later, separate concern; modeling pickup
-- against a not-yet-designed vehicles/drivers master now would be speculative.

create table public.repair_jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  job_number text not null default public.next_document_number('repair_job', 'RJ'),
  customer_id uuid not null references public.customers(id),
  transformer_make text,
  transformer_model text,
  transformer_serial_no text,
  transformer_capacity_kva numeric(12,2),
  complaint text not null,
  pickup_required boolean not null default false,
  pickup_address text,
  pickup_requested_date date,
  pickup_completed_date date,
  status text not null default 'received' check (status in ('received', 'inspection', 'estimate_pending', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, job_number)
);

create trigger trg_repair_jobs_set_updated_at
before update on public.repair_jobs
for each row execute function public.set_updated_at();

create table public.repair_estimates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  estimate_number text not null default public.next_document_number('repair_estimate', 'EST'),
  repair_job_id uuid not null references public.repair_jobs(id) on delete cascade,
  estimate_date date not null default current_date,
  status text not null default 'draft' check (status in ('draft', 'sent', 'customer_approved', 'customer_rejected')),
  subtotal numeric(12,2) not null default 0,
  tax_total numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  notes text,
  sent_at timestamptz,
  customer_approval_notes text,
  customer_approved_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, estimate_number)
);

create trigger trg_repair_estimates_set_updated_at
before update on public.repair_estimates
for each row execute function public.set_updated_at();

create table public.repair_estimate_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  repair_estimate_id uuid not null references public.repair_estimates(id) on delete cascade,
  item_type text not null default 'labor' check (item_type in ('spare_part', 'labor', 'other')),
  product_id uuid references public.products(id),
  description text not null,
  quantity numeric(12,2) not null default 1 check (quantity > 0),
  unit_price numeric(12,2) not null default 0,
  gst_rate numeric(5,2) not null default 18,
  line_total numeric(12,2) generated always as (round(quantity * unit_price * (1 + gst_rate / 100.0), 2)) stored,
  created_at timestamptz not null default now(),
  constraint repair_estimate_items_spare_needs_product check (item_type <> 'spare_part' or product_id is not null)
);
