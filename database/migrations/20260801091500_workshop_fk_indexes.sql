-- Migration: workshop_fk_indexes (20260801091500)

create index repair_jobs_company_id_idx on public.repair_jobs(company_id);
create index repair_jobs_customer_id_idx on public.repair_jobs(customer_id);
create index repair_jobs_status_idx on public.repair_jobs(status);

create index repair_estimates_company_id_idx on public.repair_estimates(company_id);
create index repair_estimates_repair_job_id_idx on public.repair_estimates(repair_job_id);
create index repair_estimates_status_idx on public.repair_estimates(status);

create index repair_estimate_items_company_id_idx on public.repair_estimate_items(company_id);
create index repair_estimate_items_estimate_id_idx on public.repair_estimate_items(repair_estimate_id);
create index repair_estimate_items_product_id_idx on public.repair_estimate_items(product_id);
