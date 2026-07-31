-- Migration: production_stage_history_rls_and_indexes (20260812091000)
-- Append-only — select + insert only, reuses manufacturing.view/manage, same
-- convention as repair_job_stage_history.

alter table public.production_stage_history enable row level security;

create policy production_stage_history_select on public.production_stage_history
  for select to authenticated
  using (company_id = public.current_company_id() and public.has_permission('manufacturing.view'));

create policy production_stage_history_insert on public.production_stage_history
  for insert to authenticated
  with check (company_id = public.current_company_id() and public.has_permission('manufacturing.manage'));

create index production_stage_history_company_id_idx on public.production_stage_history(company_id);
create index production_stage_history_order_id_idx on public.production_stage_history(production_order_id);
