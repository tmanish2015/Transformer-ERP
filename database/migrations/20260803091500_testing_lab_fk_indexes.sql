-- Migration: testing_lab_fk_indexes (20260803091500)

create index test_reports_company_id_idx on public.test_reports(company_id);
create index test_reports_customer_id_idx on public.test_reports(customer_id);
create index test_reports_repair_job_id_idx on public.test_reports(repair_job_id);
create index test_reports_test_type_id_idx on public.test_reports(test_type_id);
create index test_report_results_company_id_idx on public.test_report_results(company_id);
create index test_report_results_test_report_id_idx on public.test_report_results(test_report_id);
create index test_certificates_company_id_idx on public.test_certificates(company_id);
