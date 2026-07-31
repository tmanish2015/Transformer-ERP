-- Migration: testing_lab_schema (20260803090000)
--
-- Sprint 9 per docs-architecture/06-sprint-planning.md. Standalone-usable module: a
-- test_report can exist with no repair_job_id at all (walk-in lab customer), or linked
-- to a repair_job (post-repair test). rental_asset_id is deliberately NOT added yet —
-- rental_assets doesn't exist until Phase 3; adding an FK-less uuid column now for a
-- table that doesn't exist would be speculative, so that column lands with the Rental
-- module migration instead.

create table public.test_types (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  parameters jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.test_types (code, name, parameters) values
  ('ir', 'Insulation Resistance (IR)', '[{"key":"ir_1min","label":"IR @ 1 min","unit":"MΩ"},{"key":"ir_10min","label":"IR @ 10 min","unit":"MΩ"},{"key":"polarization_index","label":"Polarization Index","unit":""}]'),
  ('tr', 'Turns Ratio (TR)', '[{"key":"turns_ratio","label":"Turns Ratio","unit":""},{"key":"deviation_pct","label":"Deviation","unit":"%"}]'),
  ('winding_resistance', 'Winding Resistance', '[{"key":"r_phase_a","label":"R - Phase A","unit":"Ω"},{"key":"r_phase_b","label":"R - Phase B","unit":"Ω"},{"key":"r_phase_c","label":"R - Phase C","unit":"Ω"}]'),
  ('magnetizing_current', 'Magnetizing Current', '[{"key":"im","label":"Magnetizing Current","unit":"A"}]'),
  ('oil_bdv', 'Oil Breakdown Voltage (BDV)', '[{"key":"bdv","label":"Breakdown Voltage","unit":"kV"}]'),
  ('hv_test', 'High Voltage / Dielectric Test', '[{"key":"test_voltage","label":"Test Voltage","unit":"kV"},{"key":"duration","label":"Duration","unit":"sec"},{"key":"leakage_current","label":"Leakage Current","unit":"mA"}]'),
  ('vector_group', 'Vector Group Test', '[{"key":"vector_group","label":"Vector Group","unit":""}]'),
  ('load_test', 'Load Test', '[{"key":"load_pct","label":"Load Applied","unit":"%"},{"key":"temp_rise_oil","label":"Oil Temp Rise","unit":"°C"},{"key":"temp_rise_winding","label":"Winding Temp Rise","unit":"°C"}]'),
  ('temp_rise', 'Temperature Rise Test', '[{"key":"top_oil_temp_rise","label":"Top Oil Temp Rise","unit":"°C"},{"key":"winding_temp_rise","label":"Winding Temp Rise","unit":"°C"}]');

create table public.test_reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  report_number text not null default public.next_document_number('test_report', 'TR'),
  customer_id uuid not null references public.customers(id),
  repair_job_id uuid references public.repair_jobs(id) on delete set null,
  test_type_id uuid not null references public.test_types(id),
  tested_by uuid references auth.users(id) on delete set null,
  tested_at timestamptz not null default now(),
  status text not null default 'draft' check (status in ('draft', 'completed')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, report_number)
);

create trigger trg_test_reports_set_updated_at
before update on public.test_reports
for each row execute function public.set_updated_at();

create table public.test_report_results (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  test_report_id uuid not null references public.test_reports(id) on delete cascade,
  parameter_key text not null,
  parameter_label text not null,
  value text not null,
  unit text,
  pass_fail boolean,
  created_at timestamptz not null default now()
);

create table public.test_certificates (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  test_report_id uuid not null references public.test_reports(id) on delete cascade,
  certificate_number text not null default public.next_document_number('test_certificate', 'CERT'),
  storage_path text not null,
  issued_by uuid references auth.users(id) on delete set null,
  issued_at timestamptz not null default now(),
  unique (company_id, certificate_number),
  unique (test_report_id)
);
