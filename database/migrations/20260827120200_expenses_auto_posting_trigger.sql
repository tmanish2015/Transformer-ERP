-- Migration: expenses_auto_posting_trigger (20260827120200)
-- Mirrors post_purchase_payment_to_ledger (20260730091000): on insert, posts the expense to
-- the ledger as a payment voucher -- debit the chosen expense account, credit Cash/Bank
-- depending on payment_method. Tenant-scoped chart_of_accounts lookups by new.company_id.

create or replace function public.post_expense_to_ledger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  je_id uuid;
  cash_id uuid;
  bank_id uuid;
  fund_id uuid;
begin
  select id into cash_id from chart_of_accounts where company_id = new.company_id and code = '1001';
  select id into bank_id from chart_of_accounts where company_id = new.company_id and code = '1002';
  fund_id := case when new.payment_method = 'cash' then cash_id else bank_id end;

  insert into journal_entries (company_id, voucher_type, entry_date, narration, reference_type, reference_id, party_type, party_id, payment_method, created_by)
  values (
    new.company_id, 'payment', new.expense_date,
    'Expense ' || new.expense_number || ' - ' || new.description,
    'expense', new.id,
    case when new.supplier_id is not null then 'supplier' else null end, new.supplier_id,
    case new.payment_method when 'bank' then 'bank' else new.payment_method end,
    new.created_by
  )
  returning id into je_id;

  insert into journal_entry_lines (company_id, journal_entry_id, account_id, debit, credit, description) values
    (new.company_id, je_id, new.category_id, new.amount, 0, new.description),
    (new.company_id, je_id, fund_id, 0, new.amount, new.description);

  return new;
end;
$$;

create trigger trg_post_expense_to_ledger
after insert on expenses
for each row execute function post_expense_to_ledger();

revoke all on function public.post_expense_to_ledger() from public, anon, authenticated;
