-- Migration: purchases_auto_posting_triggers (20260730091000)
--
-- Deferred from the Finance sprint (Sprint 4) because these triggers fire on
-- purchase_bills/purchase_payments, which didn't exist yet. Ported from Tradeflow's
-- finance_auto_posting_triggers migration, tenant-scoped: chart_of_accounts lookups filter
-- by `new.company_id` (the row being inserted already carries the correct tenant) rather
-- than by code alone, since account codes like '2001' are only unique per company.

create or replace function public.post_purchase_bill_to_ledger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  je_id uuid;
  ap_id uuid;
  purch_id uuid;
  gst_id uuid;
begin
  select id into ap_id from chart_of_accounts where company_id = new.company_id and code = '2001';
  select id into purch_id from chart_of_accounts where company_id = new.company_id and code = '5001';
  select id into gst_id from chart_of_accounts where company_id = new.company_id and code = '1004';

  insert into journal_entries (company_id, voucher_type, entry_date, narration, reference_type, reference_id, party_type, party_id, created_by)
  values (new.company_id, 'journal', new.bill_date, 'Purchase Bill ' || new.bill_number, 'purchase_bill', new.id, 'supplier', new.supplier_id, new.created_by)
  returning id into je_id;

  insert into journal_entry_lines (company_id, journal_entry_id, account_id, debit, credit, description) values
    (new.company_id, je_id, purch_id, new.subtotal, 0, 'Bill ' || new.bill_number);

  if new.tax_total > 0 then
    insert into journal_entry_lines (company_id, journal_entry_id, account_id, debit, credit, description) values
      (new.company_id, je_id, gst_id, new.tax_total, 0, 'GST on bill ' || new.bill_number);
  end if;

  insert into journal_entry_lines (company_id, journal_entry_id, account_id, debit, credit, description) values
    (new.company_id, je_id, ap_id, 0, new.total, 'Bill ' || new.bill_number);

  return new;
end;
$$;

create trigger trg_post_purchase_bill_to_ledger
after insert on purchase_bills
for each row execute function post_purchase_bill_to_ledger();

create or replace function public.post_purchase_payment_to_ledger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  je_id uuid;
  ap_id uuid;
  cash_id uuid;
  bank_id uuid;
  fund_id uuid;
  supp_id uuid;
begin
  select id into ap_id from chart_of_accounts where company_id = new.company_id and code = '2001';
  select id into cash_id from chart_of_accounts where company_id = new.company_id and code = '1001';
  select id into bank_id from chart_of_accounts where company_id = new.company_id and code = '1002';
  select supplier_id into supp_id from purchase_bills where id = new.purchase_bill_id;
  fund_id := case when new.payment_method = 'cash' then cash_id else bank_id end;

  insert into journal_entries (company_id, voucher_type, entry_date, narration, reference_type, reference_id, party_type, party_id, payment_method, created_by)
  values (new.company_id, 'payment', new.payment_date, 'Payment made - ' || coalesce(new.reference_number, new.id::text), 'purchase_payment', new.id, 'supplier', supp_id,
    case new.payment_method when 'bank_transfer' then 'bank' else new.payment_method end, new.created_by)
  returning id into je_id;

  insert into journal_entry_lines (company_id, journal_entry_id, account_id, debit, credit, description) values
    (new.company_id, je_id, ap_id, new.amount, 0, 'Payment against bill'),
    (new.company_id, je_id, fund_id, 0, new.amount, 'Payment against bill');

  return new;
end;
$$;

create trigger trg_post_purchase_payment_to_ledger
after insert on purchase_payments
for each row execute function post_purchase_payment_to_ledger();

revoke all on function public.post_purchase_bill_to_ledger() from public, anon, authenticated;
revoke all on function public.post_purchase_payment_to_ledger() from public, anon, authenticated;
