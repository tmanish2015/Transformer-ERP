-- Migration: ceo_dashboard_permission (20260828090000)
-- The CEO/Owner dashboard aggregates finance + workshop + rental + inventory data across the
-- whole business -- broader than any single module's existing view permission -- so it gets
-- its own permission, granted only to the two owner-level roles (not accountant/workshop
-- manager/etc, who each have their own module-scoped dashboards already).

insert into public.permissions (key, module, description) values
  ('dashboard.ceo.view', 'dashboard', 'View the CEO/Owner executive dashboard');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where p.key = 'dashboard.ceo.view' and r.key in ('super_admin', 'admin');
