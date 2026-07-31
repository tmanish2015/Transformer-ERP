-- Migration: manufacturing_rls_and_indexes (20260811090500)

insert into public.permissions (key, module, description) values
  ('manufacturing.view', 'manufacturing', 'View BOMs and production orders'),
  ('manufacturing.manage', 'manufacturing', 'Manage BOMs and production orders');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where p.key = 'manufacturing.view' and r.key in ('super_admin', 'admin', 'production_manager', 'accountant');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where p.key = 'manufacturing.manage' and r.key in ('super_admin', 'admin', 'production_manager');

alter table public.boms enable row level security;
alter table public.bom_lines enable row level security;
alter table public.production_orders enable row level security;
alter table public.raw_material_requirements enable row level security;

do $$
declare
  tbl text;
  tables text[] := array['boms', 'bom_lines', 'production_orders', 'raw_material_requirements'];
begin
  foreach tbl in array tables loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_select', tbl, 'manufacturing.view'
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_insert', tbl, 'manufacturing.manage'
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (company_id = public.current_company_id() and public.has_permission(%L)) with check (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_update', tbl, 'manufacturing.manage', 'manufacturing.manage'
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_delete', tbl, 'manufacturing.manage'
    );
  end loop;
end $$;

create index boms_company_id_idx on public.boms(company_id);
create index boms_product_id_idx on public.boms(product_id);
create index bom_lines_company_id_idx on public.bom_lines(company_id);
create index bom_lines_bom_id_idx on public.bom_lines(bom_id);
create index bom_lines_raw_material_product_id_idx on public.bom_lines(raw_material_product_id);
create index production_orders_company_id_idx on public.production_orders(company_id);
create index production_orders_product_id_idx on public.production_orders(product_id);
create index production_orders_bom_id_idx on public.production_orders(bom_id);
create index raw_material_requirements_company_id_idx on public.raw_material_requirements(company_id);
create index raw_material_requirements_order_id_idx on public.raw_material_requirements(production_order_id);
