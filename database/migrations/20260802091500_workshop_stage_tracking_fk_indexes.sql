-- Migration: workshop_stage_tracking_fk_indexes (20260802091500)

create index repair_job_stage_history_company_id_idx on public.repair_job_stage_history(company_id);
create index repair_job_stage_history_repair_job_id_idx on public.repair_job_stage_history(repair_job_id);
create index repair_jobs_current_stage_idx on public.repair_jobs(current_stage);
