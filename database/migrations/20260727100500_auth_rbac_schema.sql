-- Migration: auth_rbac_schema (20260727100500)
-- Ported from Tradeflow-ai-ERP's auth_rbac_schema + add_unassigned_role_for_self_signup
-- migrations, adapted for multi-tenant: profiles gain company_id, and current_company_id()
-- is added alongside has_permission() as the second building block every RLS policy uses.

-- Roles (global catalogue, not per-tenant — every company shares the same role/permission
-- catalogue; what differs per tenant is which profiles hold which role)
create table public.roles (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  name text not null,
  description text,
  is_system boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  module text not null,
  description text,
  created_at timestamptz not null default now()
);

create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);

-- Profiles (1:1 with auth.users). company_id is nullable until the user either creates a
-- company (see company_signup_rpc migration) or is invited into an existing one — a
-- freshly self-registered user exists in auth.users before either has happened.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id),
  full_name text,
  avatar_url text,
  phone text,
  role_id uuid not null references public.roles(id),
  status text not null default 'active' check (status in ('active', 'invited', 'disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_id_idx on public.profiles(role_id);
create index profiles_company_id_idx on public.profiles(company_id);

-- Building block #1: does the current user hold a given permission key
create or replace function public.has_permission(perm_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.role_permissions rp on rp.role_id = p.role_id
    join public.permissions perm on perm.id = rp.permission_id
    where p.id = auth.uid() and perm.key = perm_key
  )
$$;

-- Building block #2: the current user's tenant. Every operational table's RLS policy
-- ANDs `company_id = current_company_id()` with a has_permission() check (see the
-- companies_and_tenant_scoping migration for the generated-policy shape).
create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from public.profiles where id = auth.uid()
$$;

revoke all on function public.has_permission(text) from public, anon;
grant execute on function public.has_permission(text) to authenticated;
revoke all on function public.current_company_id() from public, anon;
grant execute on function public.current_company_id() to authenticated;

-- Protect privileged profile fields from self-escalation (role/status/company_id)
-- app.bypass_profile_protection is a transaction-local flag, set only by
-- create_company_and_admin() (the one legitimate case where a user with no permissions
-- yet must set their own company_id/role_id) — see company_signup_rpc migration.
create or replace function public.protect_profile_privileged_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if current_setting('app.bypass_profile_protection', true) = 'on' then
    new.updated_at := now();
    return new;
  end if;
  if not public.has_permission('users.manage_roles') then
    new.role_id := old.role_id;
    new.status := old.status;
    new.company_id := old.company_id;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger trg_protect_profile_fields
before update on public.profiles
for each row execute function public.protect_profile_privileged_fields();

-- Auto-create profile on signup. company_id and role start unset/unassigned — the
-- company_signup_rpc migration's create_company_and_admin() (new company) or a future
-- invite-acceptance RPC (joining an existing company) fills them in immediately after.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_role_id uuid;
begin
  select id into default_role_id from public.roles where key = 'unassigned';
  insert into public.profiles (id, full_name, role_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    default_role_id
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- RLS
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.profiles enable row level security;
alter table public.companies enable row level security;

create policy "Authenticated can read roles" on public.roles
  for select to authenticated using (true);

create policy "Authenticated can read permissions" on public.permissions
  for select to authenticated using (true);

create policy "Authenticated can read role_permissions" on public.role_permissions
  for select to authenticated using (true);

create policy "Read own profile or same-company with users.view" on public.profiles
  for select to authenticated
  using (auth.uid() = id or (company_id = public.current_company_id() and public.has_permission('users.view')));

create policy "Update own profile; role/company change needs users.manage_roles" on public.profiles
  for update to authenticated
  using (auth.uid() = id or public.has_permission('users.manage_roles'))
  with check (auth.uid() = id or public.has_permission('users.manage_roles'));

create policy "Read own company" on public.companies
  for select to authenticated
  using (id = public.current_company_id());

create policy "Update own company with settings.manage" on public.companies
  for update to authenticated
  using (id = public.current_company_id() and public.has_permission('settings.manage'))
  with check (id = public.current_company_id() and public.has_permission('settings.manage'));

-- Seed roles (transformer-industry set, replacing Tradeflow's hardware-sales roles)
insert into public.roles (key, name, description) values
  ('unassigned', 'Unassigned', 'Self-registered account with no permissions yet; an admin must assign a real role before this user can access any module.'),
  ('super_admin', 'Super Admin', 'Full unrestricted access to the entire system (vendor-side, across the licensing schema)'),
  ('admin', 'Admin', 'Full administrative access within their company'),
  ('workshop_manager', 'Workshop Manager', 'Manages repair job cards and workshop stages'),
  ('rental_coordinator', 'Rental Coordinator', 'Manages rental assets, bookings, and agreements'),
  ('lab_engineer', 'Lab Engineer', 'Enters test results and issues test certificates'),
  ('technician', 'Technician', 'Field/floor technician — job cards, maintenance visits, attendance'),
  ('accountant', 'Accountant', 'Manages invoices, payments, and financial records'),
  ('viewer', 'Viewer', 'Read-only access across the system');

-- Seed foundational permissions (per-module permissions are added by each module's own migration)
insert into public.permissions (key, module, description) values
  ('dashboard.view', 'dashboard', 'View the dashboard'),
  ('users.view', 'users', 'View team members'),
  ('users.manage_roles', 'users', 'Change a team member''s role'),
  ('settings.manage', 'settings', 'Manage company settings');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p
where r.key in ('super_admin', 'admin');

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r, public.permissions p
where r.key not in ('super_admin', 'admin', 'unassigned') and p.key = 'dashboard.view';
