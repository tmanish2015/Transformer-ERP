-- Migration: workshop_stage_tracking_schema (20260802090000)
--
-- Sprint 8 per docs-architecture/06-sprint-planning.md: fine-grained repair stage
-- tracking. repair_jobs.status stays the coarse lifecycle state (received/inspection/
-- estimate_pending/approved/in_progress/completed/...); repair_job_stage_history is the
-- append-only detail log of which of the 12 physical repair stages the job has passed
-- through, one row per stage entry — mirrors the license_logs audit-trail pattern
-- (insert-only, no update/delete).

alter table public.repair_jobs
  add column current_stage text check (current_stage in (
    'dismantling', 'core_inspection', 'coil_inspection', 'rewinding', 'core_assembly',
    'tank_repair', 'painting', 'oil_filling', 'testing', 'qc', 'dispatch', 'installation'
  ));

create table public.repair_job_stage_history (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  repair_job_id uuid not null references public.repair_jobs(id) on delete cascade,
  stage text not null check (stage in (
    'dismantling', 'core_inspection', 'coil_inspection', 'rewinding', 'core_assembly',
    'tank_repair', 'painting', 'oil_filling', 'testing', 'qc', 'dispatch', 'installation'
  )),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
