-- Migration: companies_and_tenant_scoping (20260727100000)
--
-- Transformer-AI-ERP is row-level multi-tenant in a single Supabase project (unlike the
-- Tradeflow reference, which is one project per customer). Every operational table gets
-- a `company_id` column and is scoped by `current_company_id()` in its RLS policies,
-- generated the same way Tradeflow generates its `has_permission()`-only policies:
--
--   do $$
--   declare tbl text;
--   begin
--     foreach tbl in array array['<table1>','<table2>'] loop
--       execute format(
--         'create policy %I on public.%I for select to authenticated using (company_id = current_company_id() and has_permission(%L))',
--         tbl || '_select', tbl, '<module>.view'
--       );
--       -- insert/update/delete policies follow the same shape, '<module>.manage' gated.
--     end loop;
--   end $$;
--
-- Every later per-module migration follows this exact pattern.

create extension if not exists pgcrypto;

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  industry_type text not null check (industry_type in (
    'transformer_repair', 'transformer_manufacturing', 'transformer_rental',
    'oil_filtration_rental', 'testing_laboratory', 'electrical_services', 'other'
  )),
  status text not null default 'active' check (status in ('active', 'suspended', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trg_companies_set_updated_at
before update on public.companies
for each row execute function public.set_updated_at();
