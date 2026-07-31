-- Migration: rental_agreements_and_dispatch_schema (20260808090500)
--
-- One agreement per booking, one dispatch per agreement — this sprint's scope is a
-- single dispatch event; a return event (Sprint 15) is a separate table, not a status
-- flip on this row. Charge rates are per-day; calculate_rental_invoice (Sprint 16) reads
-- them at invoice time.

create table public.rental_agreements (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  agreement_number text not null default public.next_document_number('rental_agreement', 'AGR'),
  rental_booking_id uuid not null references public.rental_bookings(id),
  customer_id uuid not null references public.customers(id),
  rental_asset_id uuid not null references public.rental_assets(id),
  start_date date not null,
  end_date date not null,
  security_deposit numeric(12,2) not null default 0,
  late_return_charge_rate numeric(12,2) not null default 0,
  operator_provided boolean not null default false,
  operator_charge_rate numeric(12,2) not null default 0,
  fuel_charge_rate numeric(12,2) not null default 0,
  status text not null default 'active' check (status in ('active', 'completed', 'terminated')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, agreement_number),
  unique (rental_booking_id),
  constraint rental_agreements_dates_valid check (end_date >= start_date)
);

create trigger trg_rental_agreements_set_updated_at
before update on public.rental_agreements
for each row execute function public.set_updated_at();

create table public.rental_dispatches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  rental_agreement_id uuid not null references public.rental_agreements(id),
  trip_id uuid references public.trips(id),
  dispatched_at timestamptz not null default now(),
  dispatch_condition_notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (rental_agreement_id)
);
