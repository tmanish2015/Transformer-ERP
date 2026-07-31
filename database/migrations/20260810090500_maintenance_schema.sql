-- Migration: maintenance_schema (20260810090500)
--
-- Phase 3 Sprint 16 per docs-architecture/06-sprint-planning.md. reference_type
-- pre-commits 'manufactured_unit' for Phase 4 even though only 'rental_asset' is wired
-- up now (same convention as documents.reference_type). reference_id has no FK — the
-- referenced row lives in whichever module owns that reference_type.
--
-- technician_id is a plain uuid with no FK: technicians now live in the standalone
-- hr-payroll-service (see C:\Projects\hr-payroll-service), not a local table, so there's
-- nothing in this database to reference. Same opaque-reference pattern already used by
-- daily_allocations in that service.
--
-- maintenance_checklists/maintenance_checklist_items are schema-only this sprint — no
-- frontend wired to them yet. The doc's own column list (checklist_id AND visit_id both
-- present on checklist_items) implies a template/instance split whose exact UI shape
-- isn't decided; building that UI now would be guessing at a workflow nobody has
-- validated. The tables exist so a later sprint doesn't need another schema migration.

create table public.maintenance_schedules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  reference_type text not null check (reference_type in ('rental_asset', 'manufactured_unit')),
  reference_id uuid not null,
  frequency_days integer not null check (frequency_days > 0),
  next_due_at date not null,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_maintenance_schedules_set_updated_at
before update on public.maintenance_schedules
for each row execute function public.set_updated_at();

create table public.maintenance_visits (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  schedule_id uuid not null references public.maintenance_schedules(id) on delete cascade,
  visited_at timestamptz not null default now(),
  technician_id uuid,
  status text not null default 'completed' check (status in ('scheduled', 'completed', 'skipped')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.maintenance_checklists (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  name text not null,
  created_at timestamptz not null default now()
);

create table public.maintenance_checklist_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  checklist_id uuid not null references public.maintenance_checklists(id) on delete cascade,
  visit_id uuid references public.maintenance_visits(id) on delete cascade,
  item_text text not null,
  is_checked boolean not null default false,
  created_at timestamptz not null default now()
);

-- Advances the schedule's next_due_at whenever a visit is logged as completed —
-- mirrors the reused WhatsApp-notify reminder pattern's need for a fresh due date to
-- compare against.
create or replace function public.apply_maintenance_visit_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  freq_days integer;
begin
  if new.status = 'completed' then
    select frequency_days into freq_days from public.maintenance_schedules where id = new.schedule_id;
    update public.maintenance_schedules set next_due_at = new.visited_at::date + freq_days where id = new.schedule_id;
  end if;
  return new;
end;
$$;

create trigger trg_apply_maintenance_visit_completion
after insert on public.maintenance_visits
for each row execute function public.apply_maintenance_visit_completion();

revoke all on function public.apply_maintenance_visit_completion() from public, anon, authenticated;
