-- Migration: workshop_rls_and_permissions (20260801091000)
-- Same two-tier convention + tenant-scoped policy generator as every other module.

insert into public.permissions (key, module, description) values
  ('workshop.view', 'workshop', 'View repair job cards and estimates'),
  ('workshop.manage', 'workshop', 'Create and manage repair job cards and estimates');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where p.key = 'workshop.view' and r.key in ('super_admin', 'admin', 'workshop_manager', 'technician', 'accountant');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where p.key = 'workshop.manage' and r.key in ('super_admin', 'admin', 'workshop_manager');

alter table public.repair_jobs enable row level security;
alter table public.repair_estimates enable row level security;
alter table public.repair_estimate_items enable row level security;

do $$
declare
  tbl text;
  tables text[] := array['repair_jobs', 'repair_estimates', 'repair_estimate_items'];
begin
  foreach tbl in array tables loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_select', tbl, 'workshop.view'
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_insert', tbl, 'workshop.manage'
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (company_id = public.current_company_id() and public.has_permission(%L)) with check (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_update', tbl, 'workshop.manage', 'workshop.manage'
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_delete', tbl, 'workshop.manage'
    );
  end loop;
end $$;
