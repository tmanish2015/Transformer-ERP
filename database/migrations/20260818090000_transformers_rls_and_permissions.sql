-- Migration: transformers_rls_and_permissions (20260818090000)
--
-- ROOT-CAUSE FIX for: POST /rest/v1/transformers -> HTTP 403
--   "new row violates row-level security policy for table 'transformers'"
--
-- Live diagnosis (authenticated session, NOT SQL Editor) proved the auth/authorization
-- stack is healthy:
--   * current_company_id()  = 47450a90-... (valid tenant)
--   * has_permission('inventory.manage') = true (role = admin, permission present)
--   * profiles.row has company_id set and role_id = admin
--
-- The INSERT still failed with an RLS violation ONLY when company_id was omitted.
-- Re-running the same INSERT with an explicit company_id passed the RLS check and
-- proceeded to the next validation (customer_id NOT NULL). That isolated the fault to
-- the tenant-scoping column default, not the auth flow and not the RLS policy.
--
-- ROOT CAUSE:
--   The `transformers` table was created out-of-band directly in Supabase and its
--   `company_id` column is missing the `DEFAULT public.current_company_id()` that every
--   other operational table has (see 20260728090000_inventory_schema.sql etc.). The
--   frontend / client never sets company_id on insert (it relies on the column default),
--   so the inserted row's company_id is NULL and the RLS
--   `WITH CHECK (company_id = current_company_id())` evaluates to NULL -> 403.
--
-- This migration therefore:
--   1. Adds the missing tenant-scoping DEFAULT to the existing company_id column
--      (no table shape change, no security weakening, no RLS bypass, no hardcoding).
--   2. Ensures RLS is enabled and the four standard policies exist (idempotent).
--   3. Adds the two lookup indexes the list + workshop auto-fill use (idempotent).

-- 1) Restore the canonical tenant-scoping default (the primary RLS 403 fix).
--    company_id remains NOT NULL + FK to companies (unchanged). No other schema
--    change is made — in particular, serial_no's existing NOT NULL constraint is
--    intentionally left untouched. The frontend API (transformer-api.ts) supplies a
--    generated serial_no when the user leaves it blank, so the constraint is satisfied.
alter table public.transformers
  alter column company_id set default public.current_company_id();

-- 2) Ensure RLS is enabled (idempotent).
alter table public.transformers enable row level security;

-- SELECT / read policy (idempotent; matches existing convention).
drop policy if exists "transformers_select" on public.transformers;
create policy "transformers_select" on public.transformers
  for select to authenticated
  using (company_id = public.current_company_id() and public.has_permission('inventory.view'));

-- INSERT / create policy.
drop policy if exists "transformers_insert" on public.transformers;
create policy "transformers_insert" on public.transformers
  for insert to authenticated
  with check (company_id = public.current_company_id() and public.has_permission('inventory.manage'));

-- UPDATE / edit policy.
drop policy if exists "transformers_update" on public.transformers;
create policy "transformers_update" on public.transformers
  for update to authenticated
  using (company_id = public.current_company_id() and public.has_permission('inventory.manage'))
  with check (company_id = public.current_company_id() and public.has_permission('inventory.manage'));

-- DELETE policy.
drop policy if exists "transformers_delete" on public.transformers;
create policy "transformers_delete" on public.transformers
  for delete to authenticated
  using (company_id = public.current_company_id() and public.has_permission('inventory.manage'));

-- 3) Index the customer FK + registration_no used by the list and the Workshop
--    repair-job auto-fill. Idempotent guards.
do $$
begin
  if not exists (
    select 1 from pg_indexes where schemaname = 'public' and tablename = 'transformers' and indexname = 'transformers_customer_id_idx'
  ) then
    create index transformers_customer_id_idx on public.transformers (customer_id);
  end if;
  if not exists (
    select 1 from pg_indexes where schemaname = 'public' and tablename = 'transformers' and indexname = 'transformers_registration_no_idx'
  ) then
    create index transformers_registration_no_idx on public.transformers (registration_no);
  end if;
end $$;
