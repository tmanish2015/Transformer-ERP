-- Migration: rental_rls_and_permissions (20260807091000)
-- rental_coordinator is the manage-tier role (mirrors workshop_manager for workshop,
-- lab_engineer for testing-lab).

insert into public.permissions (key, module, description) values
  ('rental.view', 'rental', 'View rental assets, inquiries, quotations, and bookings'),
  ('rental.manage', 'rental', 'Manage rental assets, quote inquiries, and confirm bookings');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where p.key = 'rental.view' and r.key in ('super_admin', 'admin', 'rental_coordinator', 'accountant');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where p.key = 'rental.manage' and r.key in ('super_admin', 'admin', 'rental_coordinator');

alter table public.rental_asset_categories enable row level security;
alter table public.rental_assets enable row level security;
alter table public.rental_inquiries enable row level security;
alter table public.rental_quotations enable row level security;
alter table public.rental_quotation_items enable row level security;
alter table public.rental_bookings enable row level security;
alter table public.rental_asset_status_log enable row level security;

do $$
declare
  tbl text;
  tables text[] := array['rental_asset_categories', 'rental_assets', 'rental_inquiries', 'rental_quotations', 'rental_quotation_items', 'rental_bookings'];
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

-- Append-only — select only, written exclusively by the security-definer trigger
-- functions above, same convention as license_logs / repair_job_stage_history.
create policy rental_asset_status_log_select on public.rental_asset_status_log
  for select to authenticated
  using (company_id = public.current_company_id() and public.has_permission('rental.view'));
