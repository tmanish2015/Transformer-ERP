-- Migration: inventory_rls_and_permissions (20260728090500)
-- Two-tier permission convention (view/manage) + do-block policy generator, same
-- mechanism as the licensing migration, extended with the company_id tenant predicate
-- per docs-architecture/03-database-design.md §0.

insert into public.permissions (key, module, description) values
  ('inventory.view', 'inventory', 'View inventory data'),
  ('inventory.manage', 'inventory', 'Create, edit, and delete inventory data');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where p.key = 'inventory.view' and r.key <> 'unassigned';

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where p.key = 'inventory.manage'
  and r.key in ('super_admin', 'admin', 'workshop_manager', 'rental_coordinator');

alter table public.units enable row level security;
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.warehouses enable row level security;
alter table public.suppliers enable row level security;
alter table public.products enable row level security;
alter table public.product_suppliers enable row level security;
alter table public.product_batches enable row level security;
alter table public.serial_numbers enable row level security;
alter table public.scrap_entries enable row level security;
alter table public.stock_levels enable row level security;
alter table public.stock_movements enable row level security;

do $$
declare
  tbl text;
  tables text[] := array[
    'units','categories','brands','warehouses','suppliers','products',
    'product_suppliers','product_batches','serial_numbers','scrap_entries',
    'stock_levels'
  ];
begin
  foreach tbl in array tables loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_select', tbl, 'inventory.view'
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_insert', tbl, 'inventory.manage'
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (company_id = public.current_company_id() and public.has_permission(%L)) with check (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_update', tbl, 'inventory.manage', 'inventory.manage'
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_delete', tbl, 'inventory.manage'
    );
  end loop;
end $$;

-- stock_movements is an append-only audit ledger — select + insert only, no update/delete
-- policy at all (not even for inventory.manage), so movement history can never be tampered
-- with via the client, matching Tradeflow's original inventory_rls_and_permissions intent.
create policy "stock_movements_select" on public.stock_movements
  for select to authenticated using (company_id = public.current_company_id() and public.has_permission('inventory.view'));
create policy "stock_movements_insert" on public.stock_movements
  for insert to authenticated with check (company_id = public.current_company_id() and public.has_permission('inventory.manage'));
