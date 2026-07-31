-- Migration: sales_gl_posting (20260731091000)
--
-- Built directly in the shape Tradeflow only reached after a real production bug: its
-- original post_sales_invoice_to_ledger() fired AFTER INSERT ON sales_invoices, before
-- line items (and therefore the real subtotal/tax_total/total, computed by
-- trg_recompute_sales_invoice_totals) existed — every invoice posted to the ledger at
-- zero. Tradeflow's fix (see its fix_sales_invoice_gl_posting_timing migration) replaced
-- the trigger with an explicit, idempotent function the application calls once line
-- items are confirmed inserted. Adopting that shape from the start here.
--
-- sales_payments has no separate line-items step (the amount is present on the row at
-- insert time), so post_sales_payment_to_ledger is a plain AFTER INSERT trigger — same
-- reasoning already applied to purchase_payments in the Purchases sprint.

create or replace function public.post_sales_invoice_to_ledger(p_invoice_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  inv record;
  je_id uuid;
  ar_id uuid;
  rev_id uuid;
  gst_id uuid;
  already_posted boolean;
begin
  select exists(
    select 1 from journal_entries where reference_type = 'sales_invoice' and reference_id = p_invoice_id
  ) into already_posted;
  if already_posted then
    return;
  end if;

  select * into inv from sales_invoices where id = p_invoice_id;

  select id into ar_id from chart_of_accounts where company_id = inv.company_id and code = '1003';
  select id into rev_id from chart_of_accounts where company_id = inv.company_id and code = '4001';
  select id into gst_id from chart_of_accounts where company_id = inv.company_id and code = '2002';

  insert into journal_entries (company_id, voucher_type, entry_date, narration, reference_type, reference_id, party_type, party_id, created_by)
  values (inv.company_id, 'journal', inv.invoice_date, 'Sales Invoice ' || inv.invoice_number, 'sales_invoice', inv.id, 'customer', inv.customer_id, inv.created_by)
  returning id into je_id;

  insert into journal_entry_lines (company_id, journal_entry_id, account_id, debit, credit, description) values
    (inv.company_id, je_id, ar_id, inv.total, 0, 'Invoice ' || inv.invoice_number),
    (inv.company_id, je_id, rev_id, 0, inv.subtotal - inv.discount_total, 'Invoice ' || inv.invoice_number);

  if inv.tax_total > 0 then
    insert into journal_entry_lines (company_id, journal_entry_id, account_id, debit, credit, description) values
      (inv.company_id, je_id, gst_id, 0, inv.tax_total, 'GST on invoice ' || inv.invoice_number);
  end if;
end;
$$;

revoke all on function public.post_sales_invoice_to_ledger(uuid) from public, anon;
grant execute on function public.post_sales_invoice_to_ledger(uuid) to authenticated;

create or replace function public.post_sales_payment_to_ledger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  je_id uuid;
  ar_id uuid;
  cash_id uuid;
  bank_id uuid;
  fund_id uuid;
  cust_id uuid;
begin
  select id into ar_id from chart_of_accounts where company_id = new.company_id and code = '1003';
  select id into cash_id from chart_of_accounts where company_id = new.company_id and code = '1001';
  select id into bank_id from chart_of_accounts where company_id = new.company_id and code = '1002';
  select customer_id into cust_id from sales_invoices where id = new.sales_invoice_id;
  fund_id := case when new.payment_method = 'cash' then cash_id else bank_id end;

  insert into journal_entries (company_id, voucher_type, entry_date, narration, reference_type, reference_id, party_type, party_id, payment_method, created_by)
  values (new.company_id, 'receipt', new.payment_date, 'Payment received - ' || coalesce(new.reference_number, new.id::text), 'sales_payment', new.id, 'customer', cust_id,
    case new.payment_method when 'bank_transfer' then 'bank' else new.payment_method end, new.created_by)
  returning id into je_id;

  insert into journal_entry_lines (company_id, journal_entry_id, account_id, debit, credit, description) values
    (new.company_id, je_id, fund_id, new.amount, 0, 'Receipt against invoice'),
    (new.company_id, je_id, ar_id, 0, new.amount, 'Receipt against invoice');

  return new;
end;
$$;

create trigger trg_post_sales_payment_to_ledger
after insert on sales_payments
for each row execute function post_sales_payment_to_ledger();

revoke all on function public.post_sales_payment_to_ledger() from public, anon, authenticated;
