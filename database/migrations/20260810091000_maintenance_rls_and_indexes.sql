-- Migration: maintenance_rls_and_indexes (20260810091000)

insert into public.permissions (key, module, description) values
  ('maintenance.view', 'maintenance', 'View maintenance schedules and visits'),
  ('maintenance.manage', 'maintenance', 'Manage maintenance schedules and log visits');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where p.key = 'maintenance.view' and r.key in ('super_admin', 'admin', 'rental_coordinator', 'workshop_manager', 'accountant');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where p.key = 'maintenance.manage' and r.key in ('super_admin', 'admin', 'rental_coordinator');

alter table public.maintenance_schedules enable row level security;
alter table public.maintenance_visits enable row level security;
alter table public.maintenance_checklists enable row level security;
alter table public.maintenance_checklist_items enable row level security;

do $$
declare
  tbl text;
  tables text[] := array['maintenance_schedules', 'maintenance_visits', 'maintenance_checklists', 'maintenance_checklist_items'];
begin
  foreach tbl in array tables loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_select', tbl, 'maintenance.view'
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_insert', tbl, 'maintenance.manage'
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (company_id = public.current_company_id() and public.has_permission(%L)) with check (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_update', tbl, 'maintenance.manage', 'maintenance.manage'
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_delete', tbl, 'maintenance.manage'
    );
  end loop;
end $$;

create index maintenance_schedules_company_id_idx on public.maintenance_schedules(company_id);
create index maintenance_schedules_reference_idx on public.maintenance_schedules(reference_type, reference_id);
create index maintenance_visits_company_id_idx on public.maintenance_visits(company_id);
create index maintenance_visits_schedule_id_idx on public.maintenance_visits(schedule_id);
create index maintenance_checklists_company_id_idx on public.maintenance_checklists(company_id);
create index maintenance_checklist_items_company_id_idx on public.maintenance_checklist_items(company_id);
create index maintenance_checklist_items_checklist_id_idx on public.maintenance_checklist_items(checklist_id);
create index maintenance_checklist_items_visit_id_idx on public.maintenance_checklist_items(visit_id);
