-- Migration: finance_seed_function (20260729092000)
--
-- Tradeflow seeds its chart of accounts as a one-time migration INSERT, because there's
-- only ever one company (single-tenant-per-project). That approach can't work here: a
-- migration runs once at deploy time, but every company that signs up afterward also
-- needs its own copy of the standard chart of accounts. So this is a function, called
-- once per company at signup (see wire_signup_to_finance_seed migration) instead of a
-- one-shot data migration.

create or replace function public.seed_default_chart_of_accounts(p_company_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_assets uuid;
  v_current_liabilities uuid;
  v_capital uuid;
  v_direct_income uuid;
  v_direct_expenses uuid;
  v_indirect_expenses uuid;
begin
  insert into chart_of_accounts (company_id, code, name, account_type, account_group, is_group, is_system) values
    (p_company_id, '1000', 'Current Assets', 'asset', 'current_asset', true, true)
    returning id into v_current_assets;
  insert into chart_of_accounts (company_id, code, name, account_type, account_group, is_group, is_system) values
    (p_company_id, '2000', 'Current Liabilities', 'liability', 'current_liability', true, true)
    returning id into v_current_liabilities;
  insert into chart_of_accounts (company_id, code, name, account_type, account_group, is_group, is_system) values
    (p_company_id, '3000', 'Capital', 'equity', 'capital', true, true)
    returning id into v_capital;
  insert into chart_of_accounts (company_id, code, name, account_type, account_group, is_group, is_system) values
    (p_company_id, '4000', 'Direct Income', 'income', 'direct_income', true, true)
    returning id into v_direct_income;
  insert into chart_of_accounts (company_id, code, name, account_type, account_group, is_group, is_system) values
    (p_company_id, '5000', 'Direct Expenses', 'expense', 'cogs', true, true)
    returning id into v_direct_expenses;

  -- System leaf accounts (referenced by module names/codes in later auto-posting triggers)
  insert into chart_of_accounts (company_id, code, name, account_type, account_group, parent_id, is_system) values
    (p_company_id, '1001', 'Cash in Hand', 'asset', 'current_asset', v_current_assets, true),
    (p_company_id, '1002', 'Bank Account - Main', 'asset', 'current_asset', v_current_assets, true),
    (p_company_id, '1003', 'Accounts Receivable', 'asset', 'current_asset', v_current_assets, true),
    (p_company_id, '1004', 'GST Input Credit', 'asset', 'current_asset', v_current_assets, true),
    (p_company_id, '2001', 'Accounts Payable', 'liability', 'current_liability', v_current_liabilities, true),
    (p_company_id, '2002', 'GST Output Payable', 'liability', 'current_liability', v_current_liabilities, true),
    (p_company_id, '2003', 'TDS Payable', 'liability', 'current_liability', v_current_liabilities, true),
    (p_company_id, '3001', 'Owner''s Capital', 'equity', 'capital', v_capital, true),
    (p_company_id, '4001', 'Sales Revenue', 'income', 'direct_income', v_direct_income, true),
    (p_company_id, '4002', 'Sales Returns & Allowances', 'income', 'direct_income', v_direct_income, true),
    (p_company_id, '5001', 'Purchases / Cost of Goods Sold', 'expense', 'cogs', v_direct_expenses, true),
    (p_company_id, '5002', 'Purchase Returns & Allowances', 'expense', 'cogs', v_direct_expenses, true);

  -- Everyday operating expense accounts, editable (not system-locked)
  insert into chart_of_accounts (company_id, code, name, account_type, account_group, is_group) values
    (p_company_id, '6000', 'Indirect Expenses', 'expense', 'indirect_expense', true)
    returning id into v_indirect_expenses;
  insert into chart_of_accounts (company_id, code, name, account_type, account_group, parent_id) values
    (p_company_id, '6001', 'Rent Expense', 'expense', 'indirect_expense', v_indirect_expenses),
    (p_company_id, '6002', 'Salaries & Wages', 'expense', 'indirect_expense', v_indirect_expenses),
    (p_company_id, '6003', 'Electricity Expense', 'expense', 'indirect_expense', v_indirect_expenses),
    (p_company_id, '6004', 'Office Supplies', 'expense', 'indirect_expense', v_indirect_expenses),
    (p_company_id, '6005', 'Transportation & Freight', 'expense', 'indirect_expense', v_indirect_expenses);
end;
$$;

revoke all on function public.seed_default_chart_of_accounts(uuid) from public, anon, authenticated;
