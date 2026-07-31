-- Migration: finance_schema (20260729090500)
-- Ported from Tradeflow-ai-ERP's finance_accounts_schema migration: chart of accounts +
-- unified journal entry voucher (journal/receipt/payment/contra, Tally-style). Tenant
-- scoping added per docs-architecture/03-database-design.md §0. Debit/credit notes, TDS
-- entries, and bank reconciliation are deferred — they reference purchase_bills /
-- sales_invoices, which don't exist until the Purchases/Sales sprints.

create table public.chart_of_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  code text not null,
  name text not null,
  account_type text not null check (account_type in ('asset','liability','equity','income','expense')),
  account_group text not null check (account_group in (
    'current_asset','fixed_asset','current_liability','long_term_liability','capital',
    'direct_income','indirect_income','direct_expense','indirect_expense','cogs'
  )),
  parent_id uuid references public.chart_of_accounts(id) on delete restrict,
  is_group boolean not null default false,
  opening_balance numeric not null default 0,
  opening_balance_type text not null default 'debit' check (opening_balance_type in ('debit','credit')),
  is_system boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (company_id, code)
);

create table public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  entry_number text not null default public.next_document_number('journal_entry', 'JE'),
  voucher_type text not null default 'journal' check (voucher_type in ('journal','receipt','payment','contra')),
  entry_date date not null default current_date,
  narration text,
  reference_type text,
  reference_id uuid,
  party_type text check (party_type in ('customer','supplier')),
  party_id uuid,
  payment_method text check (payment_method in ('cash','bank','cheque','upi','card')),
  cheque_number text,
  cheque_date date,
  status text not null default 'posted' check (status in ('draft','posted','cancelled')),
  approval_status text not null default 'approved' check (approval_status in ('pending','approved','rejected')),
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, entry_number)
);

create trigger trg_journal_entries_set_updated_at
before update on public.journal_entries
for each row execute function public.set_updated_at();

create table public.journal_entry_lines (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  journal_entry_id uuid not null references public.journal_entries(id) on delete cascade,
  account_id uuid not null references public.chart_of_accounts(id) on delete restrict,
  debit numeric not null default 0 check (debit >= 0),
  credit numeric not null default 0 check (credit >= 0),
  description text,
  is_reconciled boolean not null default false,
  reconciled_at timestamptz,
  created_at timestamptz not null default now(),
  constraint journal_entry_lines_single_side check (not (debit > 0 and credit > 0))
);
