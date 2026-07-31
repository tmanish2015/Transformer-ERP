-- Migration: licensing_schema (20260727110000)
-- Ported wholesale from Tradeflow-ai-ERP's licensing engine (plans/modules/features/
-- addons/customers/subscriptions/entitlements/licenses/logs). One structural change:
-- Tradeflow links its single-row company_settings to license_customers via a text
-- license_key (necessary there, since it's one Supabase project per customer). Here,
-- companies IS the tenant registry already, so license_customers has a direct 1:1
-- company_id FK instead — no separate key-based linking needed.

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  monthly_price numeric(12,2) not null default 0,
  yearly_price numeric(12,2) not null default 0,
  trial_days integer not null default 0,
  max_users integer,
  max_branches integer,
  max_warehouses integer,
  storage_limit_gb numeric(10,2),
  status text not null default 'active' check (status in ('active','inactive','archived')),
  sequence integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.industry_packs (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now()
);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  icon text,
  sequence integer not null default 0,
  category text,
  description text,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now()
);

-- Self-referencing junction: "Workshop depends on Inventory, Finance" is one row per
-- dependency, not a single FK column.
create table public.module_dependencies (
  module_id uuid not null references public.modules(id) on delete cascade,
  depends_on_module_id uuid not null references public.modules(id) on delete cascade,
  primary key (module_id, depends_on_module_id),
  check (module_id <> depends_on_module_id)
);

create table public.features (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  code text unique not null,
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now()
);

create index features_module_id_idx on public.features(module_id);

create table public.industry_pack_modules (
  industry_pack_id uuid not null references public.industry_packs(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  primary key (industry_pack_id, module_id)
);

create table public.plan_modules (
  plan_id uuid not null references public.plans(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  primary key (plan_id, module_id)
);

create table public.plan_features (
  plan_id uuid not null references public.plans(id) on delete cascade,
  feature_id uuid not null references public.features(id) on delete cascade,
  primary key (plan_id, feature_id)
);

create table public.addons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  monthly_price numeric(12,2) not null default 0,
  yearly_price numeric(12,2) not null default 0,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now()
);

-- Tenant registry, 1:1 with companies (see migration header note above).
create table public.license_customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete cascade,
  industry_pack_id uuid references public.industry_packs(id),
  status text not null default 'trial' check (status in ('trial','active','suspended','expired','cancelled')),
  license_key text unique not null default replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customer_subscriptions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.license_customers(id) on delete cascade,
  plan_id uuid not null references public.plans(id),
  billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly','yearly')),
  start_date date not null default current_date,
  end_date date,
  trial_ends_at timestamptz,
  status text not null default 'trialing' check (status in ('trialing','active','past_due','suspended','expired','cancelled')),
  auto_renew boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customer_subscriptions_customer_id_idx on public.customer_subscriptions(customer_id);

-- Materialized (not computed live from plan+addon joins) so per-customer manual
-- overrides are possible and the entitlement-read RPC stays a cheap single select.
create table public.customer_modules (
  customer_id uuid not null references public.license_customers(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  enabled boolean not null default true,
  source text not null default 'plan' check (source in ('plan','addon','manual')),
  created_at timestamptz not null default now(),
  primary key (customer_id, module_id)
);

create table public.customer_features (
  customer_id uuid not null references public.license_customers(id) on delete cascade,
  feature_id uuid not null references public.features(id) on delete cascade,
  enabled boolean not null default true,
  source text not null default 'plan' check (source in ('plan','addon','manual')),
  created_at timestamptz not null default now(),
  primary key (customer_id, feature_id)
);

create table public.customer_addons (
  customer_id uuid not null references public.license_customers(id) on delete cascade,
  addon_id uuid not null references public.addons(id) on delete cascade,
  status text not null default 'active' check (status in ('active','cancelled')),
  billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly','yearly')),
  start_date date not null default current_date,
  end_date date,
  primary key (customer_id, addon_id)
);

create table public.licenses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.license_customers(id) on delete cascade,
  license_key text unique not null,
  issued_at timestamptz not null default now(),
  expires_at timestamptz,
  status text not null default 'active' check (status in ('active','revoked','expired')),
  max_users integer,
  max_branches integer,
  max_warehouses integer,
  created_at timestamptz not null default now()
);

create index licenses_customer_id_idx on public.licenses(customer_id);

-- Append-only audit trail. Every lifecycle RPC (activate/suspend/renew/...) writes here.
create table public.license_logs (
  id uuid primary key default gen_random_uuid(),
  license_id uuid not null references public.licenses(id) on delete cascade,
  event text not null check (event in ('issued','verified','renewed','suspended','revoked','expired','activation_attempt','activated','upgraded','downgraded')),
  notes text,
  created_at timestamptz not null default now()
);

create index license_logs_license_id_idx on public.license_logs(license_id);
