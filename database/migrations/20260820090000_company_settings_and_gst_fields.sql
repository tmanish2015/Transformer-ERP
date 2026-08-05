-- Migration: company_settings_and_gst_fields (20260820090000)
--
-- Adds company-level settings required for professional PDF generation and document
-- sharing (Parts 3-7), plus GST fields on the customers table (Part 1).
--
-- All columns are NULLABLE / have defaults so this migration is fully backward
-- compatible: existing rows keep working, and only new optional metadata is added.
-- No existing business logic, RLS policies, or columns are altered.

alter table public.companies
  add column if not exists logo_url text,
  add column if not exists company_address text,
  add column if not exists gstin text,
  add column if not exists pan_number text,
  add column if not exists terms_conditions text,
  add column if not exists authorized_signatory text,
  add column if not exists bank_name text,
  add column if not exists account_number text,
  add column if not exists ifsc_code text,
  add column if not exists branch_name text,
  add column if not exists company_email text,
  add column if not exists company_phone text,
  add column if not exists website text;

alter table public.customers
  add column if not exists pan_number text,
  add column if not exists state text,
  add column if not exists state_code text;
