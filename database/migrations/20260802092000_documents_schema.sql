-- Migration: documents_schema (20260802092000)
--
-- Generic polymorphic document vault per docs-architecture/03-database-design.md —
-- one table, not one per module. Sprint 8 wires it up for reference_type='repair_job'
-- only; the check constraint pre-commits the rest of the module list (same convention
-- as sales_invoices.invoice_type) so later modules don't need another migration just to
-- widen the constraint.

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  reference_type text not null check (reference_type in (
    'repair_job', 'rental_agreement', 'production_order', 'test_report', 'customer', 'employee'
  )),
  reference_id uuid not null,
  category text not null check (category in (
    'certificate', 'invoice', 'drawing', 'photo', 'warranty_card', 'manual', 'report'
  )),
  file_name text not null,
  storage_path text not null,
  uploaded_by uuid references auth.users(id) on delete set null,
  uploaded_at timestamptz not null default now()
);
