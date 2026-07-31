-- Migration: rental_schema (20260807090000)
--
-- Phase 3 Sprint 13 per docs-architecture/06-sprint-planning.md: asset catalog +
-- inquiry -> quotation -> booking. Agreement/dispatch/return/inspection/damage/invoice
-- are later sprints in this same phase.
--
-- rental_assets is deliberately its own table, not folded into products — a rental
-- asset has a lifecycle status machine and calendar that plain stock items don't (see
-- docs-architecture/03-database-design.md). qr_code is nullable now; actually rendering
-- one onto the asset detail screen is Sprint 16 — the column exists now so Sprint 16
-- doesn't need another schema migration just to add it.

create table public.rental_asset_categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.rental_assets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  asset_code text not null default public.next_document_number('rental_asset', 'AST'),
  category_id uuid references public.rental_asset_categories(id),
  name text not null,
  serial_number text,
  qr_code text,
  status text not null default 'available' check (status in ('available', 'booked', 'dispatched', 'running', 'returned', 'maintenance', 'retired')),
  current_location text,
  purchase_cost numeric(12,2),
  daily_rental_rate numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, asset_code)
);

create trigger trg_rental_assets_set_updated_at
before update on public.rental_assets
for each row execute function public.set_updated_at();

-- Append-only audit trail of every status transition, mirrors license_logs /
-- repair_job_stage_history — written only by trigger functions below, never inserted
-- into directly by a client.
create table public.rental_asset_status_log (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  rental_asset_id uuid not null references public.rental_assets(id) on delete cascade,
  status text not null check (status in ('available', 'booked', 'dispatched', 'running', 'returned', 'maintenance', 'retired')),
  reference_type text,
  reference_id uuid,
  created_at timestamptz not null default now()
);

create table public.rental_inquiries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  inquiry_number text not null default public.next_document_number('rental_inquiry', 'INQ'),
  customer_id uuid not null references public.customers(id),
  category_id uuid references public.rental_asset_categories(id),
  requirement text not null,
  required_from date,
  required_to date,
  status text not null default 'open' check (status in ('open', 'quoted', 'converted', 'closed')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, inquiry_number)
);

create trigger trg_rental_inquiries_set_updated_at
before update on public.rental_inquiries
for each row execute function public.set_updated_at();

create table public.rental_quotations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  quotation_number text not null default public.next_document_number('rental_quotation', 'RQT'),
  rental_inquiry_id uuid references public.rental_inquiries(id),
  customer_id uuid not null references public.customers(id),
  quotation_date date not null default current_date,
  valid_until date,
  status text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  subtotal numeric(12,2) not null default 0,
  tax_total numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, quotation_number)
);

create trigger trg_rental_quotations_set_updated_at
before update on public.rental_quotations
for each row execute function public.set_updated_at();

create table public.rental_quotation_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  rental_quotation_id uuid not null references public.rental_quotations(id) on delete cascade,
  rental_asset_id uuid not null references public.rental_assets(id),
  rental_days integer not null check (rental_days > 0),
  daily_rate numeric(12,2) not null default 0,
  gst_rate numeric(5,2) not null default 18,
  line_total numeric(12,2) generated always as (round(rental_days * daily_rate * (1 + gst_rate / 100.0), 2)) stored,
  created_at timestamptz not null default now()
);

create table public.rental_bookings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  booking_number text not null default public.next_document_number('rental_booking', 'BKG'),
  rental_quotation_id uuid references public.rental_quotations(id),
  customer_id uuid not null references public.customers(id),
  rental_asset_id uuid not null references public.rental_assets(id),
  start_date date not null,
  end_date date not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'completed')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, booking_number),
  constraint rental_bookings_dates_valid check (end_date >= start_date)
);

create trigger trg_rental_bookings_set_updated_at
before update on public.rental_bookings
for each row execute function public.set_updated_at();
