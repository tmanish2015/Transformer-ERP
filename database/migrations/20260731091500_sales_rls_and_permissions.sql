-- Migration: sales_rls_and_permissions (20260731091500)
-- Same two-tier convention + tenant-scoped policy generator as every other module.
-- customers lives under sales.view/sales.manage (matches Tradeflow — customer master is
-- a sales dependency, not a separate CRM permission, since the CRM-extension tables
-- (opportunities, tickets, contacts, activities) that would justify a distinct crm.*
-- permission are deferred to Phase 5).

insert into public.permissions (key, module, description) values
  ('sales.view', 'sales', 'View customers, quotations, sales orders, deliveries, invoices, and payments'),
  ('sales.manage', 'sales', 'Create and manage customers, quotations, sales orders, deliveries, invoices, and payments');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where p.key = 'sales.view' and r.key in ('super_admin', 'admin', 'accountant', 'workshop_manager', 'rental_coordinator');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where p.key = 'sales.manage' and r.key in ('super_admin', 'admin', 'workshop_manager', 'rental_coordinator');

alter table public.customers enable row level security;
alter table public.quotations enable row level security;
alter table public.quotation_items enable row level security;
alter table public.sales_orders enable row level security;
alter table public.sales_order_items enable row level security;
alter table public.delivery_challans enable row level security;
alter table public.delivery_challan_items enable row level security;
alter table public.sales_invoices enable row level security;
alter table public.sales_invoice_items enable row level security;
alter table public.sales_payments enable row level security;

do $$
declare
  tbl text;
  tables text[] := array[
    'customers', 'quotations', 'quotation_items', 'sales_orders', 'sales_order_items',
    'delivery_challans', 'delivery_challan_items', 'sales_invoices', 'sales_invoice_items', 'sales_payments'
  ];
begin
  foreach tbl in array tables loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_select', tbl, 'sales.view'
    );
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_insert', tbl, 'sales.manage'
    );
    execute format(
      'create policy %I on public.%I for update to authenticated using (company_id = public.current_company_id() and public.has_permission(%L)) with check (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_update', tbl, 'sales.manage', 'sales.manage'
    );
    execute format(
      'create policy %I on public.%I for delete to authenticated using (company_id = public.current_company_id() and public.has_permission(%L))',
      tbl || '_delete', tbl, 'sales.manage'
    );
  end loop;
end $$;
