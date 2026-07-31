-- Licensing engine RLS + permission keys. Ported verbatim from Tradeflow (same table
-- set, same view/manage two-tier convention, same do-block policy generator). These
-- tables are the vendor's own catalogue/tenant-registry, not per-tenant operational
-- data, so they are NOT company_id-scoped like every other module's tables will be —
-- access to them is has_permission('licensing.*') only, same as Tradeflow.

insert into public.permissions (key, module, description) values
  ('licensing.view', 'licensing', 'View plans, modules, features, add-ons, industry packs, and customers'),
  ('licensing.manage', 'licensing', 'Manage plans, modules, features, add-ons, industry packs, and customer subscriptions/licenses');

alter table public.plans enable row level security;
alter table public.industry_packs enable row level security;
alter table public.modules enable row level security;
alter table public.module_dependencies enable row level security;
alter table public.features enable row level security;
alter table public.industry_pack_modules enable row level security;
alter table public.plan_modules enable row level security;
alter table public.plan_features enable row level security;
alter table public.addons enable row level security;
alter table public.license_customers enable row level security;
alter table public.customer_subscriptions enable row level security;
alter table public.customer_modules enable row level security;
alter table public.customer_features enable row level security;
alter table public.customer_addons enable row level security;
alter table public.licenses enable row level security;
alter table public.license_logs enable row level security;

do $$
declare
  t text;
  tables text[] := array[
    'plans','industry_packs','modules','module_dependencies','features',
    'industry_pack_modules','plan_modules','plan_features','addons',
    'license_customers','customer_subscriptions','customer_modules','customer_features',
    'customer_addons','licenses','license_logs'
  ];
begin
  foreach t in array tables loop
    execute format('create policy %I on public.%I for select to authenticated using (public.has_permission(''licensing.view''))', t || '_select', t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.has_permission(''licensing.manage''))', t || '_insert', t);
    execute format('create policy %I on public.%I for update to authenticated using (public.has_permission(''licensing.manage'')) with check (public.has_permission(''licensing.manage''))', t || '_update', t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.has_permission(''licensing.manage''))', t || '_delete', t);
  end loop;
end $$;
