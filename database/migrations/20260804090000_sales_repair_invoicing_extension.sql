-- Migration: sales_repair_invoicing_extension (20260804090000)
--
-- Sprint 10 per docs-architecture/06-sprint-planning.md. sales_invoices.invoice_type
-- already had 'repair' pre-committed since the Sprint 6 schema, and
-- post_sales_invoice_to_ledger() only ever reads header totals — so the only schema gap
-- for repair invoicing is: (a) a way to trace an invoice back to its repair_job, and
-- (b) line items that aren't a stocked product (labor / other estimate lines have no
-- product_id). Everything else (GL posting, payment recording) is already generic.

alter table public.sales_invoices
  add column repair_job_id uuid references public.repair_jobs(id);

-- One invoice per repair job — prevents accidentally double-invoicing a completed job.
create unique index sales_invoices_repair_job_id_uidx on public.sales_invoices(repair_job_id) where repair_job_id is not null;

alter table public.sales_invoice_items
  alter column product_id drop not null,
  add column description text,
  add constraint sales_invoice_items_needs_product_or_description check (product_id is not null or description is not null);
