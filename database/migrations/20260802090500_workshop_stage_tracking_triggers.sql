-- Migration: workshop_stage_tracking_triggers (20260802090500)
-- Logging the first stage entry moves an approved job into 'in_progress'; logging the
-- final 'installation' stage completes it. Same child-table-drives-parent-status
-- pattern as apply_repair_estimate_status / apply_goods_receipt_item.

create or replace function public.apply_repair_stage_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.repair_jobs
  set
    current_stage = new.stage,
    status = case
      when new.stage = 'installation' then 'completed'
      when status = 'approved' then 'in_progress'
      else status
    end
  where id = new.repair_job_id;
  return new;
end;
$$;

create trigger trg_apply_repair_stage_history
after insert on public.repair_job_stage_history
for each row execute function public.apply_repair_stage_history();

revoke all on function public.apply_repair_stage_history() from public, anon, authenticated;
