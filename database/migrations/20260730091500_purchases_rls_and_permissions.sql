-- Migration: purchases_rls_and_permissions (20260730091500)
-- Same two-tier permission convention + tenant-scoped policy generator as every other module.

insert into public.permissions (key, module, description) values
  ('purchases.view', 'purchases', 'View purchase orders, receipts, and bills'),
  ('purchases.manage', 'purchases', 'Create and manage purchase orders, receipts, bills, and payments');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where p.key = 'purchases.view' and r.key in ('super_admin', 'admin', 'accountant', 'workshop_manager', 'rental_coordinator');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where p.key = 'purchases.manage' and r.key in ('super_admin', 'admin', 'accountant');

alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
alter table public.goods_receipts enable row level security;
alter table public.goods_receipt_items enable row level security;
alter table public.purchase_bills enable row level security;
alter table public.purchase_payments enable row level security;

do $$
declare
  tbl text;
  tables text[] := array['purchase_orders', 'purchase_order_items', 'goods_receipts', 'goods_receipt_items', 'purchase_bills', 'purchase_payments'];
begin
  foreach tbl in array tables loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_select', tbl, 'purchases.view'
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_insert', tbl, 'purchases.manage'
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (company_id = public.current_company_id() and public.has_permission(%L)) with check (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_update', tbl, 'purchases.manage', 'purchases.manage'
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_delete', tbl, 'purchases.manage'
    );
  end loop;
end $$;
