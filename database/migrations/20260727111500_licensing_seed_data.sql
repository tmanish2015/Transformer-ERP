-- Licensing seed data for Transformer-AI-ERP (replaces Tradeflow's hardware-sales seed).
-- Modules correspond 1:1 to features/<slug> folders (see docs-architecture/02-feature-mapping.md).

insert into public.modules (code, name, category, sequence, description) values
  ('crm', 'CRM', 'core', 10, 'Leads, customers, site surveys, quotations, AMC contracts'),
  ('inventory', 'Inventory', 'core', 20, 'Products, stock, warehouses, batches, serial numbers'),
  ('purchases', 'Purchase', 'core', 30, 'Requisitions, purchase orders, GRN, vendor bills'),
  ('sales', 'Sales', 'core', 40, 'Quotations, sales orders, invoices, dispatch'),
  ('finance', 'Finance', 'core', 50, 'Chart of accounts, journal entries, GST/TDS, cash & bank'),
  ('workshop', 'Repair Workshop', 'vertical', 60, 'Transformer repair job cards and stage tracking'),
  ('rental', 'Rental Management', 'vertical', 70, 'Rental asset lifecycle, agreements, dispatch, returns'),
  ('manufacturing', 'Manufacturing', 'vertical', 80, 'BOM, production orders, production stage tracking'),
  ('testing-lab', 'Testing Laboratory', 'vertical', 90, 'Test reports and certificate issuance'),
  ('maintenance', 'Preventive Maintenance', 'support', 100, 'Maintenance/calibration schedules and reminders'),
  ('logistics', 'Logistics', 'support', 110, 'Vehicles, drivers, pickup/delivery trips'),
  ('hr', 'HR', 'support', 120, 'Attendance, leave, salary, skill matrix'),
  ('documents', 'Document Management', 'support', 130, 'Central document vault'),
  ('reports', 'Reports', 'support', 140, 'Cross-module reporting'),
  ('ai', 'AI Assistant', 'support', 150, 'AI-assisted quotation, diagnosis, forecasting, search');

-- Dependencies: a vertical module cannot be enabled without its prerequisites.
insert into public.module_dependencies (module_id, depends_on_module_id)
select m.id, d.id from public.modules m, public.modules d
where (m.code, d.code) in (
  ('workshop', 'inventory'), ('workshop', 'finance'), ('workshop', 'crm'),
  ('rental', 'inventory'), ('rental', 'finance'), ('rental', 'crm'),
  ('manufacturing', 'inventory'), ('manufacturing', 'finance'),
  ('maintenance', 'rental'),
  ('logistics', 'workshop')
);

insert into public.industry_packs (code, name, description) values
  ('repair_workshop', 'Repair Workshop Pack', 'For transformer repair companies and electrical service contractors'),
  ('manufacturing', 'Manufacturing Pack', 'For transformer manufacturers'),
  ('rental', 'Rental Pack', 'For transformer/oil-filtration rental companies'),
  ('testing_lab', 'Testing Lab Pack', 'For standalone electrical testing laboratories'),
  ('enterprise', 'Enterprise Pack', 'All modules — large industrial maintenance & EPC contractors');

insert into public.industry_pack_modules (industry_pack_id, module_id)
select ip.code_id, m.id from (
  select id as code_id, code from public.industry_packs
) ip, public.modules m
where
  (ip.code = 'repair_workshop' and m.code in ('crm','inventory','purchases','sales','finance','workshop','testing-lab','logistics','hr','documents','reports','ai'))
  or (ip.code = 'manufacturing' and m.code in ('crm','inventory','purchases','sales','finance','manufacturing','testing-lab','documents','reports','ai'))
  or (ip.code = 'rental' and m.code in ('crm','inventory','purchases','sales','finance','rental','maintenance','logistics','documents','reports','ai'))
  or (ip.code = 'testing_lab' and m.code in ('crm','sales','finance','testing-lab','documents','reports'))
  or (ip.code = 'enterprise' and m.code in ('crm','inventory','purchases','sales','finance','workshop','rental','manufacturing','testing-lab','maintenance','logistics','hr','documents','reports','ai'));

insert into public.plans (code, name, monthly_price, yearly_price, trial_days, max_users, max_branches, max_warehouses, sequence) values
  ('starter', 'Starter', 4999, 49999, 14, 5, 1, 2, 10),
  ('workshop_pro', 'Workshop Pro', 12999, 129999, 14, 20, 3, 5, 20),
  ('rental_pro', 'Rental Pro', 14999, 149999, 14, 20, 3, 10, 30),
  ('enterprise', 'Enterprise', 29999, 299999, 30, null, null, null, 40);

insert into public.plan_modules (plan_id, module_id)
select p.id, m.id from public.plans p, public.modules m
where
  (p.code = 'starter' and m.code in ('crm','inventory','purchases','sales','finance'))
  or (p.code = 'workshop_pro' and m.code in ('crm','inventory','purchases','sales','finance','workshop','testing-lab','logistics','hr','documents','reports'))
  or (p.code = 'rental_pro' and m.code in ('crm','inventory','purchases','sales','finance','rental','maintenance','logistics','documents','reports'))
  or (p.code = 'enterprise' and m.code in ('crm','inventory','purchases','sales','finance','workshop','rental','manufacturing','testing-lab','maintenance','logistics','hr','documents','reports','ai'));
