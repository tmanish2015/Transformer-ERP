-- Migration: finance_rls_and_permissions (20260729091000)
-- Same view/manage two-tier convention + tenant-scoped policy generator as every
-- other module.

insert into public.permissions (key, module, description) values
  ('finance.view', 'finance', 'View finance & accounts data'),
  ('finance.manage', 'finance', 'Manage finance & accounts data');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where p.key = 'finance.view' and r.key in ('super_admin', 'admin', 'accountant', 'workshop_manager', 'rental_coordinator');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where p.key = 'finance.manage' and r.key in ('super_admin', 'admin', 'accountant');

alter table public.chart_of_accounts enable row level security;
alter table public.journal_entries enable row level security;
alter table public.journal_entry_lines enable row level security;

do $$
declare
  tbl text;
  tables text[] := array['chart_of_accounts', 'journal_entries', 'journal_entry_lines'];
begin
  foreach tbl in array tables loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_select', tbl, 'finance.view'
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_insert', tbl, 'finance.manage'
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (company_id = public.current_company_id() and public.has_permission(%L)) with check (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_update', tbl, 'finance.manage', 'finance.manage'
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_delete', tbl, 'finance.manage'
    );
  end loop;
end $$;
