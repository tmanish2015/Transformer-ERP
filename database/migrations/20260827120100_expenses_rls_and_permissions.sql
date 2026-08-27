-- Migration: expenses_rls_and_permissions (20260827120100)
-- Expenses lives inside the Finance module -- reuses the existing finance.view/finance.manage
-- permissions rather than minting new ones, same tenant-scoped policy convention as every
-- other module.

alter table public.expenses enable row level security;

create policy "expenses_select" on public.expenses
  for select to authenticated using (company_id = public.current_company_id() and public.has_permission('finance.view'));

create policy "expenses_insert" on public.expenses
  for insert to authenticated with check (company_id = public.current_company_id() and public.has_permission('finance.manage'));

create policy "expenses_update" on public.expenses
  for update to authenticated using (company_id = public.current_company_id() and public.has_permission('finance.manage'))
  with check (company_id = public.current_company_id() and public.has_permission('finance.manage'));

create policy "expenses_delete" on public.expenses
  for delete to authenticated using (company_id = public.current_company_id() and public.has_permission('finance.manage'));
