-- Migration: rental_return_inspection_damage_schema (20260809090000)
--
-- Phase 3 Sprint 15. One return per agreement, one inspection per return (keeps this
-- sprint's scope to a single inspection round), many damage line items per inspection.
-- late_days/is_late are NOT accepted from the client — computed by
-- apply_rental_return_status from returned_at vs the agreement's end_date, same
-- reasoning as the warranty end_date fix (push date arithmetic into Postgres, don't
-- trust a client-computed date diff).

create table public.rental_returns (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  rental_agreement_id uuid not null references public.rental_agreements(id),
  trip_id uuid references public.trips(id),
  returned_at timestamptz not null default now(),
  return_condition_notes text,
  is_late boolean not null default false,
  late_days integer not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (rental_agreement_id)
);

create table public.rental_inspections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  rental_return_id uuid not null references public.rental_returns(id) on delete cascade,
  inspected_by uuid references auth.users(id) on delete set null,
  inspected_at timestamptz not null default now(),
  condition_rating text not null check (condition_rating in ('good', 'fair', 'damaged')),
  notes text,
  created_at timestamptz not null default now(),
  unique (rental_return_id)
);

create table public.rental_damage_assessments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  rental_inspection_id uuid not null references public.rental_inspections(id) on delete cascade,
  description text not null,
  estimated_repair_cost numeric(12,2) not null default 0,
  charged_to_customer boolean not null default true,
  created_at timestamptz not null default now()
);
