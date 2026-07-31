-- Migration: logistics_schema (20260808090000)
--
-- Base logistics module, deferred from Phase 2 (workshop pickup used plain columns on
-- repair_jobs instead — see workshop_schema.sql's note; a real logistics module wasn't
-- justified for one deferred field). Rental dispatch/return is what actually needs it
-- now. gps_start/gps_end stay jsonb placeholders ({lat,lng,captured_at}) — "GPS-ready
-- architecture" per docs-architecture/03-database-design.md, no live device integration
-- in v1. reference_type pre-commits both this sprint's use (rental_dispatch) and next
-- sprint's (rental_return), same convention as documents.reference_type.

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  registration_no text not null,
  type text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (company_id, registration_no)
);

create table public.drivers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  name text not null,
  license_no text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  vehicle_id uuid references public.vehicles(id),
  driver_id uuid references public.drivers(id),
  trip_type text not null check (trip_type in ('pickup', 'delivery')),
  reference_type text not null check (reference_type in ('rental_dispatch', 'rental_return')),
  reference_id uuid not null,
  gps_start jsonb,
  gps_end jsonb,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.trip_costs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  cost_type text not null check (cost_type in ('fuel', 'toll', 'other')),
  amount numeric(12,2) not null check (amount >= 0),
  notes text,
  created_at timestamptz not null default now()
);

create table public.trip_photos (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  storage_path text not null,
  uploaded_by uuid references auth.users(id) on delete set null,
  uploaded_at timestamptz not null default now()
);

create table public.customer_signatures (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  storage_path text not null,
  signed_at timestamptz not null default now()
);
