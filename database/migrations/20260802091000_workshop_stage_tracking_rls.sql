-- Migration: workshop_stage_tracking_rls (20260802091000)
-- repair_job_stage_history is append-only (mirrors license_logs) — select + insert
-- policies only, no update/delete. Reuses the existing workshop.view/workshop.manage
-- permissions rather than minting new ones for a table that's still part of the same
-- module lifecycle.

alter table public.repair_job_stage_history enable row level security;

create policy repair_job_stage_history_select on public.repair_job_stage_history
  for select to authenticated
  using (company_id = public.current_company_id() and public.has_permission('workshop.view'));

create policy repair_job_stage_history_insert on public.repair_job_stage_history
  for insert to authenticated
  with check (company_id = public.current_company_id() and public.has_permission('workshop.manage'));
