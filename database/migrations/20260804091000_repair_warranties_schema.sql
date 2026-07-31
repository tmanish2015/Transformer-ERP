-- Migration: repair_warranties_schema (20260804091000)
-- One warranty per repair job (unique repair_job_id) — re-issuing would mean editing the
-- existing row, not inserting a second one. status is derived client-side from
-- end_date vs today (same pattern as sales invoice overdueAmount/isInvoiceOverdue), not
-- stored, so there's no daily job needed to flip an 'active'/'expired' column.

create table public.repair_warranties (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  repair_job_id uuid not null references public.repair_jobs(id) on delete cascade,
  warranty_months integer not null check (warranty_months > 0),
  start_date date not null default current_date,
  end_date date not null,
  terms text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (repair_job_id)
);

create index repair_warranties_company_id_idx on public.repair_warranties(company_id);

alter table public.repair_warranties enable row level security;

create policy repair_warranties_select on public.repair_warranties
  for select to authenticated
  using (company_id = public.current_company_id() and public.has_permission('workshop.view'));

create policy repair_warranties_insert on public.repair_warranties
  for insert to authenticated
  with check (company_id = public.current_company_id() and public.has_permission('workshop.manage'));
