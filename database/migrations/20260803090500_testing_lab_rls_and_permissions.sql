-- Migration: testing_lab_rls_and_permissions (20260803090500)
-- lab_engineer is the manage-tier role (mirrors workshop_manager for workshop).
-- test_certificates has no update/delete policy — once issued, a certificate is
-- immutable, same append-only spirit as license_logs/repair_job_stage_history.

insert into public.permissions (key, module, description) values
  ('testing-lab.view', 'testing-lab', 'View test types, reports, and certificates'),
  ('testing-lab.manage', 'testing-lab', 'Create test reports and issue certificates');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where p.key = 'testing-lab.view' and r.key in ('super_admin', 'admin', 'workshop_manager', 'lab_engineer', 'technician', 'accountant');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where p.key = 'testing-lab.manage' and r.key in ('super_admin', 'admin', 'lab_engineer');

alter table public.test_types enable row level security;
alter table public.test_reports enable row level security;
alter table public.test_report_results enable row level security;
alter table public.test_certificates enable row level security;

-- test_types is a shared seed catalog, not tenant-scoped — readable by any authenticated
-- user with view permission, same spirit as a lookup table.
create policy test_types_select on public.test_types
  for select to authenticated
  using (public.has_permission('testing-lab.view'));

do $$
declare
  tbl text;
  tables text[] := array['test_reports', 'test_report_results'];
begin
  foreach tbl in array tables loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_select', tbl, 'testing-lab.view'
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_insert', tbl, 'testing-lab.manage'
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (company_id = public.current_company_id() and public.has_permission(%L)) with check (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_update', tbl, 'testing-lab.manage', 'testing-lab.manage'
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_delete', tbl, 'testing-lab.manage'
    );
  end loop;
end $$;

create policy test_certificates_select on public.test_certificates
  for select to authenticated
  using (company_id = public.current_company_id() and public.has_permission('testing-lab.view'));

create policy test_certificates_insert on public.test_certificates
  for insert to authenticated
  with check (company_id = public.current_company_id() and public.has_permission('testing-lab.manage'));
