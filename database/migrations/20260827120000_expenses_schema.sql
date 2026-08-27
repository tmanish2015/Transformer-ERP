-- Migration: expenses_schema (20260827120000)
--
-- Expense Management. Reuses the existing double-entry accounting engine (chart_of_accounts
-- + journal_entries/journal_entry_lines, same as purchase_payments/sales_payments) rather than
-- inventing a parallel ledger -- category_id points at an existing chart_of_accounts expense
-- account, and a trigger (see expenses_auto_posting_triggers) auto-posts each expense to the
-- ledger the same way purchase payments already do. Optionally links to an existing supplier
-- and/or an existing repair job ("Work Order" in the UI) via repair_job_id.

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) default public.current_company_id(),
  expense_number text not null default public.next_document_number('expense', 'EXP'),
  expense_date date not null default current_date,
  category_id uuid not null references public.chart_of_accounts(id),
  description text not null,
  supplier_id uuid references public.suppliers(id) on delete set null,
  payee_name text,
  repair_job_id uuid references public.repair_jobs(id) on delete set null,
  amount numeric(12,2) not null check (amount > 0),
  payment_method text not null check (payment_method in ('cash','bank','cheque','upi','card')),
  reference_number text,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index expenses_company_id_idx on public.expenses(company_id);
create index expenses_category_id_idx on public.expenses(category_id);
create index expenses_supplier_id_idx on public.expenses(supplier_id);
create index expenses_repair_job_id_idx on public.expenses(repair_job_id);
create index expenses_expense_date_idx on public.expenses(expense_date);
create unique index expenses_expense_number_company_idx on public.expenses(company_id, expense_number);
