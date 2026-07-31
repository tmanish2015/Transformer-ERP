-- Migration: hr_lite_schema (20260804091500)
--
-- hr-lite per docs-architecture/06-sprint-planning.md Sprint 10, technician assignment
-- only. The employees/daily_allocations DATA now lives in the standalone
-- hr-payroll-service project (own DB, own deploy) so it can plug into any host ERP,
-- not just this one — see C:\Projects\hr-payroll-service\README.md for the integration
-- contract. Transformer's own DB only needs the permission rows below, to gate the HR
-- screens in the UI the same way every other module is gated; the data itself is
-- fetched through supabase/functions/hr-proxy, which forwards to that external service.

insert into public.permissions (key, module, description) values
  ('hr.view', 'hr', 'View employees and daily allocations'),
  ('hr.manage', 'hr', 'Manage employees and assign daily allocations');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where p.key = 'hr.view' and r.key in ('super_admin', 'admin', 'workshop_manager', 'technician', 'accountant');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where p.key = 'hr.manage' and r.key in ('super_admin', 'admin', 'workshop_manager');
