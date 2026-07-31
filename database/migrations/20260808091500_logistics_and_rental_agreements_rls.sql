-- Migration: logistics_and_rental_agreements_rls (20260808091500)
-- logistics is shared across verticals (workshop pickup could use it later too), so both
-- rental_coordinator and workshop_manager get manage-tier access.

insert into public.permissions (key, module, description) values
  ('logistics.view', 'logistics', 'View vehicles, drivers, and trips'),
  ('logistics.manage', 'logistics', 'Manage vehicles, drivers, and log trips');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where p.key = 'logistics.view' and r.key in ('super_admin', 'admin', 'rental_coordinator', 'workshop_manager', 'accountant');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where p.key = 'logistics.manage' and r.key in ('super_admin', 'admin', 'rental_coordinator', 'workshop_manager');

alter table public.vehicles enable row level security;
alter table public.drivers enable row level security;
alter table public.trips enable row level security;
alter table public.trip_costs enable row level security;
alter table public.trip_photos enable row level security;
alter table public.customer_signatures enable row level security;
alter table public.rental_agreements enable row level security;
alter table public.rental_dispatches enable row level security;

do $$
declare
  tbl text;
  tables text[] := array['vehicles', 'drivers', 'trips', 'trip_costs', 'trip_photos', 'customer_signatures'];
begin
  foreach tbl in array tables loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_select', tbl, 'logistics.view'
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_insert', tbl, 'logistics.manage'
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (company_id = public.current_company_id() and public.has_permission(%L)) with check (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_update', tbl, 'logistics.manage', 'logistics.manage'
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_delete', tbl, 'logistics.manage'
    );
  end loop;
end $$;

do $$
declare
  tbl text;
  tables text[] := array['rental_agreements', 'rental_dispatches'];
begin
  foreach tbl in array tables loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_select', tbl, 'rental.view'
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_insert', tbl, 'rental.manage'
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (company_id = public.current_company_id() and public.has_permission(%L)) with check (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_update', tbl, 'rental.manage', 'rental.manage'
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_delete', tbl, 'rental.manage'
    );
  end loop;
end $$;
