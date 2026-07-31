-- Migration: test_reports_production_order_extension (20260813090000)
--
-- Phase 4 Sprint 19: factory acceptance testing. Same shape as the existing
-- repair_job_id nullable FK — a test_reports row can now optionally trace back to
-- either a repair job or a production order (or neither, for a walk-in lab customer).
-- No RLS/permission changes needed — testing-lab.* already governs this table.

alter table public.test_reports
  add column production_order_id uuid references public.production_orders(id);

create index test_reports_production_order_id_idx on public.test_reports(production_order_id);
